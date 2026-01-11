from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Farm, CropStatus, ScoutingLog, IrrigationLog
from app.services.weather_service import get_forecast
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
import json
import logging

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI SDK not available. Install with: pip install openai")

router = APIRouter()

# Simple in-memory cache (6 hours TTL)
class AdviceCache:
    def __init__(self, ttl_hours: int = 6):
        self.cache: Dict[str, tuple] = {}
        self.ttl = timedelta(hours=ttl_hours)
    
    def get(self, key: str) -> Optional[Dict]:
        if key not in self.cache:
            return None
        data, timestamp = self.cache[key]
        if datetime.now() - timestamp > self.ttl:
            del self.cache[key]
            return None
        return data
    
    def set(self, key: str, data: Dict):
        self.cache[key] = (data, datetime.now())

cache = AdviceCache(ttl_hours=6)

def get_rule_based_advice(farm: Farm, latest_status: Optional[CropStatus], forecast: Dict, tasks: List[Dict], lang: str) -> Dict:
    """Generate rule-based advice when AI is not available"""
    
    summary_parts = []
    bullets = []
    
    # Stage-based advice
    if latest_status:
        stage = latest_status.stage
        if stage == "flowering":
            summary_parts.append("Your grapes are flowering. This is a critical time for fruit set.")
            bullets.append("Monitor for pests and diseases daily")
            bullets.append("Avoid heavy irrigation during flowering")
        elif stage == "fruit_set":
            summary_parts.append("Small grapes are forming. Focus on healthy growth.")
            bullets.append("Check for sunburn on young berries")
            bullets.append("Maintain consistent irrigation")
        elif stage == "veraison":
            summary_parts.append("Grapes are changing color. Harvest is approaching.")
            bullets.append("Monitor sweetness (Brix) regularly")
            bullets.append("Watch for bird damage")
        elif stage == "harvest":
            summary_parts.append("Harvest time! Ensure quality and timing.")
            bullets.append("Check Brix before picking")
            bullets.append("Harvest in cool morning hours")
    
    # Issue-based advice
    if latest_status:
        if latest_status.mildew_signs:
            bullets.append("Mildew detected: Monitor closely and consider consulting local agri officer")
        if latest_status.cracking:
            bullets.append("Cracking seen: Avoid sudden irrigation changes")
        if latest_status.sunburn:
            bullets.append("Sunburn spots: Check canopy coverage")
        if latest_status.pest_signs:
            bullets.append("Pests observed: Do morning scouting to identify type")
    
    # Weather-based advice
    if forecast.get("days") and len(forecast["days"]) > 0:
        next_3_days = forecast["days"][:3]
        heavy_rain = any(d.get("precipitation_sum", 0) and d["precipitation_sum"] > 20 for d in next_3_days)
        high_temp = any(d.get("temp_max") and d["temp_max"] > 35 for d in next_3_days)
        
        if heavy_rain:
            bullets.append("Heavy rain expected: Avoid irrigating before rain, check drainage")
        if high_temp:
            bullets.append("High temperatures: Irrigate early morning or evening")
    
    # Task-based advice
    if tasks:
        high_priority = [t for t in tasks if t.get("priority") == "high"]
        if high_priority:
            bullets.append(f"You have {len(high_priority)} high priority tasks today")
    
    # Default summary if nothing specific
    if not summary_parts:
        summary_parts.append("Monitor your farm regularly and follow best practices.")
    
    summary = " ".join(summary_parts)
    
    # Ensure we have at least 4 bullets
    if len(bullets) < 4:
        bullets.extend([
            "Do regular field scouting",
            "Maintain irrigation schedule",
            "Record observations in the app",
            "Consult local agriculture officer for specific issues"
        ])
    
    return {
        "summary": summary[:200],  # Limit length
        "bullets": bullets[:6]  # Max 6 bullets
    }

async def get_ai_advice(farm: Farm, latest_status: Optional[CropStatus], forecast: Dict, tasks: List[Dict], lang: str) -> Optional[Dict]:
    """Call OpenAI API to generate advice using the latest model"""
    if not OPENAI_AVAILABLE:
        logger.info("AI advice: OpenAI SDK not available, using fallback")
        return None
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.info("AI advice: OPENAI_API_KEY not set, using fallback")
        return None
    
    # Get model from env var, default to gpt-5.2
    model = os.getenv("OPENAI_MODEL", "gpt-5.2")
    logger.info(f"AI advice: Using model {model} for farm {farm.id}")
    
    # Prepare context
    context_parts = []
    
    # Farm info
    context_parts.append(f"Farm location: {farm.lat}, {farm.lon}")
    if farm.country_code:
        context_parts.append(f"Country: {farm.country_code}")
    
    # Crop status
    if latest_status:
        context_parts.append(f"Stage: {latest_status.stage}")
        if latest_status.sweetness_brix:
            context_parts.append(f"Brix: {latest_status.sweetness_brix}°Bx")
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
        if issues:
            context_parts.append(f"Issues: {', '.join(issues)}")
        if latest_status.last_irrigation:
            context_parts.append(f"Last irrigation: {latest_status.last_irrigation}")
        if latest_status.last_spray:
            context_parts.append(f"Last spray: {latest_status.last_spray}")
        if latest_status.notes:
            context_parts.append(f"Notes: {latest_status.notes[:100]}")
    
    # Weather
    if forecast.get("days"):
        weather_summary = []
        for day in forecast["days"][:7]:
            temp_max = day.get("temp_max")
            precip = day.get("precipitation_sum", 0) or 0
            if temp_max:
                weather_summary.append(f"{temp_max:.1f}°C, {precip:.1f}mm rain")
        if weather_summary:
            context_parts.append(f"Weather (7 days): {', '.join(weather_summary)}")
    
    # Tasks
    if tasks:
        task_titles = [t.get("title", "") for t in tasks[:5]]
        context_parts.append(f"Today's tasks: {', '.join(task_titles)}")
    
    context = "\n".join(context_parts)
    
    # Language mapping
    lang_map = {
        "en": "English",
        "hi": "Hindi",
        "es": "Spanish",
        "mr": "Marathi"
    }
    language = lang_map.get(lang, "English")
    
    # Create prompt
    prompt = f"""You are an agricultural advisor for table grape farmers. Provide weekly advice based on the farm data below.

IMPORTANT SAFETY RULES:
- DO NOT mention specific chemical names, doses, or mixing instructions
- DO NOT provide pesticide recommendations
- DO provide general advice like: "monitor for issues", "consult local agri officer", "avoid irrigating before rain", "do morning scouting"
- Keep advice practical and farmer-friendly
- Use simple words

Farm data:
{context}

Respond in {language} language. Output a JSON object with:
- "summary": A 2-3 sentence summary (max 200 characters)
- "bullets": An array of 4-6 short bullet points (each max 80 characters)

Example format:
{{
  "summary": "Your grapes are flowering. Monitor for pests and maintain irrigation.",
  "bullets": [
    "Do morning scouting for pests",
    "Avoid heavy irrigation during flowering",
    "Monitor for mildew signs",
    "Check canopy coverage"
  ]
}}
"""
    
    # Retry logic for JSON parsing
    max_retries = 2
    for attempt in range(max_retries):
        try:
            client = AsyncOpenAI(api_key=api_key)
            
            # On retry, add stricter JSON instruction
            system_message = "You are a helpful agricultural advisor. Always respond with valid JSON only."
            user_message = prompt
            if attempt > 0:
                user_message = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object."
            
            # Use Responses API
            response = await client.responses.create(
                model=model,
                input=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                text={"format": {"type": "json_object"}},  # JSON mode in Responses API
                max_output_tokens=300
            )
            
            # Read output using Responses API helper
            content = response.output_text.strip()
            
            # Try to extract JSON from response (in case of markdown code blocks)
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            result = json.loads(content)
            
            # Validate structure
            if "summary" not in result or "bullets" not in result:
                raise ValueError("Invalid response format: missing 'summary' or 'bullets'")
            
            logger.info(f"AI advice: Successfully generated advice using {model}")
            return {
                "summary": result["summary"][:200],
                "bullets": result["bullets"][:6]
            }
            
        except json.JSONDecodeError as e:
            logger.warning(f"AI advice: JSON decode error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                continue
            else:
                logger.error(f"AI advice: Failed to parse JSON after {max_retries} attempts")
                return None
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    return None

@router.post("/weekly-advice")
async def get_weekly_advice(
    farm_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """Generate AI weekly advice for a farm"""
    
    # Get farm first (needed for language and validation)
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Get language for cache key
    lang = farm.preferred_language or "en"
    
    # Check cache first
    cache_key = f"advice_{farm_id}_{lang}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Get latest status
    latest_status = db.query(CropStatus).filter(
        CropStatus.farm_id == farm_id
    ).order_by(CropStatus.recorded_at.desc()).first()
    
    # Get weather forecast
    forecast = await get_forecast(farm.lat, farm.lon, days=7)
    
    # Get recent activity for context
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_scouting_count = db.query(ScoutingLog).filter(
        ScoutingLog.farm_id == farm_id,
        ScoutingLog.observed_at >= seven_days_ago
    ).count()
    recent_irrigation_count = db.query(IrrigationLog).filter(
        IrrigationLog.farm_id == farm_id,
        IrrigationLog.irrigated_at >= seven_days_ago
    ).count()
    
    # Create simple task summary for context
    tasks = []
    if recent_scouting_count == 0:
        tasks.append({"title": "Perform field scouting", "priority": "high"})
    if recent_irrigation_count == 0:
        tasks.append({"title": "Check irrigation needs", "priority": "medium"})
    
    # Try AI first, fallback to rule-based
    advice = await get_ai_advice(farm, latest_status, forecast, tasks, lang)
    
    if not advice:
        logger.info(f"AI advice: Using rule-based fallback for farm {farm_id}")
        advice = get_rule_based_advice(farm, latest_status, forecast, tasks, lang)
    else:
        logger.info(f"AI advice: Using AI-generated advice for farm {farm_id}")
    
    # Cache the result
    cache.set(cache_key, advice)
    
    return advice

