from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import (
    Farm, Block, CropStatus, ScoutingLog, IrrigationLog, BrixSample, ChatMessage, ChatSession
)
from app.schemas import ChatMessageRequest, ChatMessageReply, ChatMessageResponse
from app.services.weather_service import get_forecast
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
import json
import logging
import uuid

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI SDK not available. Install with: pip install openai")

router = APIRouter()

def build_farm_context(farm: Farm, db: Session) -> Dict:
    """Build compact context JSON for the AI"""
    context = {
        "farm": {
            "name": farm.name or "My Farm",
            "location": f"{farm.lat}, {farm.lon}",
            "country": farm.country_code or "unknown"
        },
        "block": None,
        "latest_status": None,
        "recent_scouting": [],
        "recent_irrigation": [],
        "recent_brix": [],
        "last_scan": None,
        "weather_forecast": None
    }
    
    # Get main block (first block or "Main Block")
    main_block = db.query(Block).filter(
        Block.farm_id == farm.id
    ).filter(
        (Block.name == "Main Block") | (Block.name.like("%Main%"))
    ).first()
    
    if not main_block:
        main_block = db.query(Block).filter(
            Block.farm_id == farm.id
        ).first()
    
    if main_block:
        context["block"] = {
            "name": main_block.name,
            "variety": main_block.variety,
            "irrigation_type": main_block.irrigation_type
        }
    
    # Get latest crop status
    latest_status = db.query(CropStatus).filter(
        CropStatus.farm_id == farm.id
    ).order_by(CropStatus.recorded_at.desc()).first()
    
    if latest_status:
        issues = []
        if latest_status.cracking:
            issues.append("cracking")
        if latest_status.sunburn:
            issues.append("sunburn")
        if latest_status.mildew_signs:
            issues.append("mildew")
        if latest_status.botrytis_signs:
            issues.append("botrytis")
        if latest_status.pest_signs:
            issues.append("pests")
        
        context["latest_status"] = {
            "stage": latest_status.stage,
            "brix": latest_status.sweetness_brix,
            "issues": issues,
            "last_irrigation": latest_status.last_irrigation,
            "last_spray": latest_status.last_spray,
            "recorded_at": latest_status.recorded_at.isoformat() if latest_status.recorded_at else None
        }
    
    # Get last 5 scouting logs
    scouting_logs = db.query(ScoutingLog).filter(
        ScoutingLog.farm_id == farm.id
    ).order_by(ScoutingLog.observed_at.desc()).limit(5).all()
    
    context["recent_scouting"] = [
        {
            "issue": log.issue_type,
            "severity": log.severity,
            "notes": log.notes[:100] if log.notes else None,
            "observed_at": log.observed_at.isoformat() if log.observed_at else None,
            "has_photo": bool(log.photo_path)
        }
        for log in scouting_logs
    ]
    
    # Get last scan result (most recent scouting log with photo)
    last_scan_log = db.query(ScoutingLog).filter(
        ScoutingLog.farm_id == farm.id,
        ScoutingLog.photo_path.isnot(None)
    ).order_by(ScoutingLog.observed_at.desc()).first()
    
    if last_scan_log:
        context["last_scan"] = {
            "issue": last_scan_log.issue_type,
            "severity": last_scan_log.severity,
            "summary": last_scan_log.notes[:200] if last_scan_log.notes else None,
            "observed_at": last_scan_log.observed_at.isoformat() if last_scan_log.observed_at else None
        }
    
    # Get last 5 irrigation logs
    irrigation_logs = db.query(IrrigationLog).filter(
        IrrigationLog.farm_id == farm.id
    ).order_by(IrrigationLog.irrigated_at.desc()).limit(5).all()
    
    context["recent_irrigation"] = [
        {
            "amount_mm": log.amount_mm,
            "duration_min": log.duration_min,
            "irrigated_at": log.irrigated_at.isoformat() if log.irrigated_at else None
        }
        for log in irrigation_logs
    ]
    
    # Get last 3 brix samples
    brix_samples = db.query(BrixSample).filter(
        BrixSample.farm_id == farm.id
    ).order_by(BrixSample.sampled_at.desc()).limit(3).all()
    
    context["recent_brix"] = [
        {
            "brix": sample.brix,
            "sampled_at": sample.sampled_at.isoformat() if sample.sampled_at else None
        }
        for sample in brix_samples
    ]
    
    return context

async def get_ai_reply(user_message: str, farm_context: Dict, lang: str) -> Optional[str]:
    """Get AI reply using OpenAI Responses API"""
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
        
        # Build system message
        system_message = f"""You are TableGrape Agent, a friendly and helpful assistant for table grape farmers. Be warm, conversational, and human-like.

STYLE RULES:
- Keep answers 2-6 lines by default (unless user asks for detail)
- Use simple, farmer-friendly words. Avoid stiff phrases like "You are in..." repeatedly
- Write short sentences. Avoid long paragraphs
- Be conversational and natural, like talking to a friend
- Only reference farm context when it's directly relevant to the question
- If something is unclear or a next step is needed, ask one short follow-up question at the end
- If the user message is vague (e.g., "okay", "hmm", "what's new"), respond with a short clarifying question + 2 example options

FORMATTING:
- NO markdown (no **, no markdown bullets, no code blocks)
- Use plain text only
- For lists, use simple lines starting with "• " (bullet character only)

SAFETY RULES:
- DO NOT mention specific chemical names, doses, or mixing instructions
- DO NOT provide pesticide recommendations
- DO provide general advice like: "consult local agri officer", "monitor for issues", "improve airflow", "avoid irrigating before heavy rain"

Respond in {language} language. Keep it friendly, concise, and practical."""
        
        # Build user message with context (only include relevant context)
        # Only include context if the question seems to need it
        needs_context = any(keyword in user_message.lower() for keyword in [
            "stage", "status", "weather", "forecast", "irrigation", "spray", 
            "issue", "problem", "mildew", "sunburn", "crack", "pest", "brix",
            "harvest", "variety", "block", "farm"
        ])
        
        if needs_context:
            context_json = json.dumps(farm_context, indent=2)
            user_message_with_context = f"""Farm context (use only if relevant):
{context_json}

User question: {user_message}

Answer naturally and concisely in {language}."""
        else:
            user_message_with_context = f"""User question: {user_message}

Answer naturally and concisely in {language}."""
        
        # Use Responses API (text-only, not JSON mode)
        response = await client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message_with_context}
            ],
            max_output_tokens=300
        )
        
        reply = response.output_text.strip()
        logger.info(f"Chat: Successfully generated reply using {model}")
        return reply
        
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return None

def is_greeting(text: str) -> bool:
    """Check if the text is a greeting"""
    if not text:
        return False
    
    # Normalize: lowercase and strip
    normalized = text.lower().strip()
    
    # Must be short (<= 20 chars)
    if len(normalized) > 20:
        return False
    
    # Common greetings in English, Hindi, Spanish, Marathi
    greetings = {
        # English
        "hi", "hello", "hey", "namaste", "good morning", "good evening", 
        "good afternoon", "good night", "greetings", "hi there", "hey there",
        # Hindi
        "हाय", "नमस्ते", "नमस्कार", "नमस्कार", "प्रणाम",
        # Spanish
        "hola", "buenos días", "buenas tardes", "buenas noches", "saludos",
        # Marathi
        "नमस्कार", "हॅलो", "हाय"
    }
    
    # Check exact match
    if normalized in greetings:
        return True
    
    # Check if it starts with a greeting (e.g., "hi there", "hello friend")
    for greeting in greetings:
        if normalized.startswith(greeting + " ") or normalized == greeting:
            return True
    
    return False

def get_greeting_reply(lang: str) -> str:
    """Return a friendly greeting reply with options"""
    if lang == "hi":
        return """नमस्ते! मैं TableGrape Agent हूं, आपकी मदद करने के लिए यहां हूं।

आज मैं आपकी कैसे मदद कर सकता हूं?

• आज की फार्म योजना देखें
• कोई समस्या रिपोर्ट करें (दरारें / फफूंद / धूप से जलना)
• मौसम के बारे में पूछें और क्या करना है"""
    elif lang == "es":
        return """¡Hola! Soy TableGrape Agent, aquí para ayudarte.

¿Cómo puedo ayudarte hoy?

• Ver el plan de la granja de hoy
• Reportar un problema (grietas / mildiu / quemaduras solares)
• Preguntar sobre el clima y qué hacer"""
    elif lang == "mr":
        return """नमस्कार! मी TableGrape Agent आहे, तुमची मदत करण्यासाठी येथे आहे.

आज मी तुमची कशी मदत करू शकतो?

• आजची फार्म योजना पहा
• समस्या नोंदवा (क्रॅक / मिल्ड्यू / सनबर्न)
• हवामानाबद्दल विचारा आणि काय करावे"""
    else:  # English
        return """Hello! I'm TableGrape Agent, here to help you.

How can I help you today?

• Check today's farm plan
• Report an issue (cracks / mildew / sunburn)
• Ask about weather and what to do"""

def is_acknowledgement(text: str) -> bool:
    """Check if the text is an acknowledgement/small-talk"""
    if not text:
        return False
    
    # Normalize: lowercase and strip
    normalized = text.lower().strip()
    
    # Must be short (<= 20 chars)
    if len(normalized) > 20:
        return False
    
    # Common acknowledgements
    acknowledgements = {
        "ok", "okay", "kk", "k", "sure", "cool", "great", "nice", 
        "thanks", "thank you", "thx", "ty", "👍", "👌", 
        "hmm", "hmmm", "yes", "yep"
    }
    
    # Check exact match
    return normalized in acknowledgements

def is_whats_new(text: str) -> bool:
    """Check if the text is asking for updates/what's new"""
    if not text:
        return False
    
    normalized = text.lower().strip()
    whats_new_phrases = {
        "what's new", "whats new", "what is new", "update", "updates",
        "anything new", "what happened", "what changed"
    }
    
    return normalized in whats_new_phrases or normalized.startswith("what's new") or normalized.startswith("whats new")

def get_whats_new_reply(lang: str) -> str:
    """Return a reply with options for 'what's new' queries"""
    if lang == "hi":
        return """यहाँ क्या कर सकते हैं:

• साप्ताहिक सलाह देखें
• फोटो स्कैन करें
• कोई सवाल पूछें"""
    elif lang == "es":
        return """Aquí está lo que puedo hacer:

• Ver consejos semanales
• Escanear una foto
• Hacer una pregunta"""
    elif lang == "mr":
        return """येथे काय करू शकतो:

• साप्ताहिक सल्ला पहा
• फोटो स्कॅन करा
• प्रश्न विचारा"""
    else:  # English
        return """Here's what I can do:

• Get weekly advice
• Scan a photo
• Ask a question"""

def get_ack_reply(lang: str) -> str:
    """Return a friendly acknowledgement reply with options"""
    if lang == "hi":
        return "ठीक है। मौसम देखना चाहेंगे, कोई समस्या बताना चाहेंगे, या आज का काम प्लान करना चाहेंगे?"
    elif lang == "es":
        return "Entendido. ¿Quieres revisar el clima, reportar un problema o planificar el trabajo de hoy?"
    elif lang == "mr":
        return "ठीक आहे. हवामान पाहू इच्छिता, समस्या नोंदवू इच्छिता, किंवा आजचे काम प्लॅन करू इच्छिता?"
    else:  # English
        return "Got it. Want to check weather, report an issue, or plan today's work?"

def get_fallback_reply(user_message: str, lang: str) -> str:
    """Return a simple fallback reply"""
    if lang == "hi":
        return "क्षमा करें, AI सहायक अभी उपलब्ध नहीं है। कृपया अपने स्थानीय कृषि अधिकारी से सलाह लें।"
    elif lang == "es":
        return "Lo siento, el asistente de IA no está disponible en este momento. Por favor, consulte con su oficial agrícola local."
    elif lang == "mr":
        return "क्षमा करा, AI सहाय्यक आत्ता उपलब्ध नाही. कृपया आपल्या स्थानिक कृषी अधिकाऱ्याशी सल्ला घ्या."
    else:
        return "I'm sorry, the AI assistant is not available right now. Please consult with your local agriculture officer."

@router.get("/chat/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    farm_id: str = Query(...),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get chat message history for a farm"""
    
    # Validate farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Get messages in chronological order with stable sort
    messages = db.query(ChatMessage).filter(
        ChatMessage.farm_id == farm_id
    ).order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc()).limit(limit).all()
    
    # Normalize roles to lowercase (in case of old data)
    for msg in messages:
        if msg.role:
            msg.role = msg.role.lower()
    
    # Return in chronological order (oldest first, stable by ID)
    return messages

@router.post("/chat/message", response_model=ChatMessageReply)
async def send_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """Send a message and get AI reply"""
    
    # Validate farm
    farm = db.query(Farm).filter(Farm.id == request.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Generate session_id if missing
    session_id = request.session_id
    if not session_id:
        session_id = str(uuid.uuid4())
        logger.info(f"Chat: Generated new session_id {session_id} for farm {request.farm_id}")
    
    # Ensure ChatSession exists
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        session = ChatSession(
            id=session_id,
            farm_id=request.farm_id,
            title=None
        )
        db.add(session)
        db.flush()
        logger.info(f"Chat: Created new ChatSession {session_id} for farm {request.farm_id}")
    
    # Use farm's preferred language if lang not provided
    lang = request.lang or farm.preferred_language or "en"
    
    # Save user message first (ensures it gets earlier timestamp/ID)
    user_msg = ChatMessage(
        farm_id=request.farm_id,
        session_id=session_id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.flush()  # Flush to get ID/timestamp before commit
    db.commit()
    db.refresh(user_msg)  # Refresh to ensure all fields are populated
    
    # Check for intent handlers (before building context)
    # Check if it's asking "what's new"
    if is_whats_new(request.message):
        logger.info(f"Chat: Detected 'what's new' query for farm {request.farm_id}")
        reply_text = get_whats_new_reply(lang)
    # Check if it's a short acknowledgement with options
    elif len(request.message.strip()) <= 20 and is_acknowledgement(request.message):
        logger.info(f"Chat: Detected short acknowledgement for farm {request.farm_id}")
        reply_text = get_ack_reply(lang)
    # Check if it's a greeting
    elif is_greeting(request.message):
        logger.info(f"Chat: Detected greeting for farm {request.farm_id}")
        reply_text = get_greeting_reply(lang)
    else:
        # Build farm context for non-greeting messages
        farm_context = build_farm_context(farm, db)
        
        # Get weather forecast
        try:
            forecast = await get_forecast(farm.lat, farm.lon, days=7)
            if forecast.get("days"):
                farm_context["weather_forecast"] = {
                    "next_7_days": [
                        {
                            "date": day.get("date"),
                            "temp_max": day.get("temp_max"),
                            "temp_min": day.get("temp_min"),
                            "precipitation": day.get("precipitation_sum", 0) or 0
                        }
                        for day in forecast["days"][:7]
                    ]
                }
        except Exception as e:
            logger.warning(f"Error fetching weather for chat: {e}")
        
        # Get AI reply
        reply_text = await get_ai_reply(request.message, farm_context, lang)
        
        if not reply_text:
            logger.info(f"Chat: Using fallback reply for farm {request.farm_id}")
            reply_text = get_fallback_reply(request.message, lang)
    
    # Save assistant reply (after user message is committed)
    assistant_msg = ChatMessage(
        farm_id=request.farm_id,
        session_id=session_id,
        role="assistant",
        content=reply_text
    )
    db.add(assistant_msg)
    db.flush()  # Flush to get ID/timestamp before commit
    db.commit()
    db.refresh(assistant_msg)  # Refresh to ensure all fields are populated
    
    return ChatMessageReply(reply=reply_text, session_id=session_id)

@router.delete("/chat/history")
async def clear_chat_history(
    farm_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """Clear chat history for a farm"""
    
    # Validate farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Delete all messages for this farm
    deleted_count = db.query(ChatMessage).filter(
        ChatMessage.farm_id == farm_id
    ).delete()
    
    db.commit()
    
    logger.info(f"Chat: Cleared {deleted_count} messages for farm {farm_id}")
    
    return {"ok": True, "deleted": deleted_count}

