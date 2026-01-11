from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Farm, ScoutingLog
from datetime import datetime
from typing import Dict, List, Optional
import os
import json
import logging
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI SDK not available. Install with: pip install openai")

router = APIRouter()

# Ensure uploads directory exists (relative to backend directory)
BACKEND_DIR = Path(__file__).parent.parent.parent
UPLOADS_DIR = BACKEND_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def get_rule_based_scan_result(lang: str) -> Dict:
    """Return rule-based fallback when AI is not available"""
    return {
        "photo_path": None,
        "stage": "unknown",
        "issues": [],
        "summary": "AI scan not available. Please describe symptoms in Chat." if lang == "en" else "AI स्कैन उपलब्ध नहीं है। कृपया Chat में लक्षण बताएं।" if lang == "hi" else "Escaneo IA no disponible. Por favor describe los síntomas en Chat." if lang == "es" else "AI स्कॅन उपलब्ध नाही. कृपया Chat मध्ये लक्षणे वर्णन करा.",
        "next_actions": [
            "Use Chat to describe the issue" if lang == "en" else "Chat में समस्या बताएं" if lang == "hi" else "Usa Chat para describir el problema" if lang == "es" else "समस्या वर्णन करण्यासाठी Chat वापरा",
            "Take photo in good light" if lang == "en" else "अच्छी रोशनी में फोटो लें" if lang == "hi" else "Toma foto con buena luz" if lang == "es" else "चांगल्या प्रकाशात फोटो घ्या",
            "Check leaves and bunches closely" if lang == "en" else "पत्ते और गुच्छे को बारीकी से जांचें" if lang == "hi" else "Revisa hojas y racimos de cerca" if lang == "es" else "पाने आणि गुच्छे जवळून तपासा"
        ]
    }

async def analyze_image_with_ai(image_path: str, lang: str) -> Optional[Dict]:
    """Analyze image using OpenAI vision API"""
    if not OPENAI_AVAILABLE:
        return None
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    
    model = os.getenv("OPENAI_MODEL", "gpt-5.2")
    
    # Language mapping
    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "es": "Spanish",
        "mr": "Marathi"
    }
    language = lang_map.get(lang, "English")
    
    try:
        client = AsyncOpenAI(api_key=api_key)
        
        # Read image and encode to base64
        import base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Determine image format
        image_ext = Path(image_path).suffix.lower()
        mime_type = f"image/{image_ext[1:]}" if image_ext else "image/jpeg"
        if image_ext == ".png":
            mime_type = "image/png"
        elif image_ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        elif image_ext == ".webp":
            mime_type = "image/webp"
        
        prompt = f"""You are an agricultural expert analyzing a photo of table grapes (fresh eating grapes, not wine grapes).

Analyze this image and provide:
1. Crop stage: one of "early_growth", "flowering", "fruit_set", "veraison", "harvest", or "unknown"
2. Visible issues: list any visible problems like cracking, sunburn, mildew-like signs, rot-like signs, pests
3. Summary: brief description in {language}
4. Next actions: safe recommendations (NO chemical names, NO doses, NO mixing instructions)

IMPORTANT SAFETY RULES:
- DO NOT mention specific chemical names, doses, or mixing instructions
- DO NOT provide pesticide recommendations
- DO provide general advice like: "consult local agri officer", "remove damaged bunches", "improve airflow", "monitor after rain"

Respond in {language} language. Output a JSON object with:
- "stage": string (one of: early_growth, flowering, fruit_set, veraison, harvest, unknown)
- "issues": array of {{"name": string, "severity": 0-3, "confidence": 0.0-1.0}}
- "summary": string (brief description)
- "next_actions": array of strings (safe recommendations, no chemicals)

Example format:
{{
  "stage": "fruit_set",
  "issues": [
    {{"name": "sunburn", "severity": 2, "confidence": 0.8}},
    {{"name": "mildew-like signs", "severity": 1, "confidence": 0.6}}
  ],
  "summary": "Small grapes visible with some sunburn spots. White powder on some leaves.",
  "next_actions": [
    "Check canopy coverage",
    "Monitor for mildew development",
    "Consult local agri officer if issues worsen"
  ]
}}
"""
        
        # Use Chat Completions API for vision (vision requires image support)
        # Note: Using gpt-4o for vision capability; Responses API doesn't support images yet
        response = await client.chat.completions.create(
            model="gpt-4o",  # Vision-capable model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content.strip()
        
        # Extract JSON
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        result = json.loads(content)
        
        # Validate structure
        if "stage" not in result or "issues" not in result or "summary" not in result or "next_actions" not in result:
            raise ValueError("Invalid response format")
        
        logger.info(f"Scan: Successfully analyzed image using {model}")
        return {
            "stage": result.get("stage", "unknown"),
            "issues": result.get("issues", []),
            "summary": result.get("summary", ""),
            "next_actions": result.get("next_actions", [])
        }
        
    except Exception as e:
        logger.error(f"OpenAI vision API error: {e}")
        return None

@router.post("/scan")
async def scan_image(
    farm_id: str = Form(...),
    block_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    lang: Optional[str] = Form("en"),
    db: Session = Depends(get_db)
):
    """Scan an image of grapes/leaves and return analysis"""
    
    # Validate farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Use farm's preferred language if lang not provided
    if not lang or lang == "en":
        lang = farm.preferred_language or "en"
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        photo_path = f"uploads/{unique_filename}"
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")
    
    # Analyze with AI
    analysis = await analyze_image_with_ai(str(file_path), lang)
    
    if not analysis:
        logger.info(f"Scan: Using rule-based fallback for farm {farm_id}")
        result = get_rule_based_scan_result(lang)
        result["photo_path"] = photo_path
    else:
        result = {
            "photo_path": photo_path,
            "stage": analysis["stage"],
            "issues": analysis["issues"],
            "summary": analysis["summary"],
            "next_actions": analysis["next_actions"]
        }
    
    # Create scouting log
    try:
        # Determine main issue and severity
        main_issue = "unknown"
        max_severity = 0
        
        if result["issues"] and len(result["issues"]) > 0:
            # Find highest severity issue
            max_severity_issue = max(result["issues"], key=lambda x: x.get("severity", 0))
            main_issue = max_severity_issue.get("name", "unknown")
            max_severity = max_severity_issue.get("severity", 0)
        
        # Combine AI summary with user notes
        log_notes = result["summary"]
        if notes:
            log_notes = f"{result['summary']}\n\nUser notes: {notes}"
        
        scouting_log = ScoutingLog(
            farm_id=farm_id,
            block_id=block_id,
            observed_at=datetime.now(),
            photo_path=photo_path,
            issue_type=main_issue,
            severity=max_severity,
            notes=log_notes
        )
        db.add(scouting_log)
        db.commit()
        db.refresh(scouting_log)
        
        logger.info(f"Scan: Created scouting log {scouting_log.id} for farm {farm_id}")
    except Exception as e:
        logger.error(f"Error creating scouting log: {e}")
        # Don't fail the request if log creation fails
    
    return result

