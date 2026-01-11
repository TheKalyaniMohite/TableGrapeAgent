from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Farm, Block, ScoutingLog, IrrigationLog, BrixSample, SprayLog, CropStatus
from app.services.weather_service import get_forecast
from app.services.plan_constants import *
from datetime import datetime, timedelta
from typing import List, Dict, Optional

router = APIRouter()

# Constants for insights
HARVEST_BRIX_TARGET = 15.0  # Target brix for harvest readiness
HEAVY_RAIN_THRESHOLD = 20.0  # mm per day for heavy rain
HIGH_HUMIDITY_THRESHOLD = 80.0  # Relative humidity (if available)

@router.get("/today")
async def get_today_plan(farm_id: str = Query(...), db: Session = Depends(get_db)):
    """Generate today's plan based on weather, recent logs, and crop status"""
    
    # Get farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    today = datetime.now().date()
    seven_days_ago = datetime.now() - timedelta(days=7)
    three_days_ago = datetime.now() - timedelta(days=3)
    
    # Get weather forecast (7 days for insights)
    forecast = await get_forecast(farm.lat, farm.lon, days=7)
    weather_summary = _summarize_weather(forecast)
    
    # Get latest crop status
    latest_status = db.query(CropStatus).filter(
        CropStatus.farm_id == farm_id
    ).order_by(CropStatus.recorded_at.desc()).first()
    
    # Get recent logs
    recent_scouting = db.query(ScoutingLog).filter(
        ScoutingLog.farm_id == farm_id,
        ScoutingLog.observed_at >= seven_days_ago
    ).all()
    
    recent_irrigation = db.query(IrrigationLog).filter(
        IrrigationLog.farm_id == farm_id,
        IrrigationLog.irrigated_at >= seven_days_ago
    ).all()
    
    recent_brix = db.query(BrixSample).filter(
        BrixSample.farm_id == farm_id,
        BrixSample.sampled_at >= seven_days_ago
    ).all()
    
    recent_spray = db.query(SprayLog).filter(
        SprayLog.farm_id == farm_id,
        SprayLog.sprayed_at >= seven_days_ago
    ).all()
    
    recent_logs_summary = {
        "scouting_count": len(recent_scouting),
        "irrigation_count": len(recent_irrigation),
        "brix_count": len(recent_brix),
        "spray_count": len(recent_spray)
    }
    
    latest_status_summary = None
    if latest_status:
        latest_status_summary = {
            "stage": latest_status.stage,
            "recorded_at": latest_status.recorded_at.isoformat(),
            "has_issues": any([
                latest_status.cracking,
                latest_status.sunburn,
                latest_status.mildew_signs,
                latest_status.botrytis_signs,
                latest_status.pest_signs
            ])
        }
    
    # Generate tasks
    tasks = _generate_tasks(
        forecast, latest_status, recent_scouting, recent_irrigation,
        recent_brix, recent_spray, today, three_days_ago
    )
    
    # Generate 7-day insights
    next_7_days_insights = _generate_insights(forecast, latest_status, today)
    
    return {
        "date": today.isoformat(),
        "tasks": tasks,
        "next_7_days_insights": next_7_days_insights,
        "signals_used": {
            "weather_summary": weather_summary,
            "recent_logs_summary": recent_logs_summary,
            "latest_status_summary": latest_status_summary
        }
    }

def _generate_tasks(forecast, latest_status, recent_scouting, recent_irrigation,
                   recent_brix, recent_spray, today, three_days_ago):
    """Generate tasks based on weather, status, and logs"""
    tasks = []
    
    # Weather-based tasks
    if forecast.get("days"):
        today_forecast = forecast["days"][0] if len(forecast["days"]) > 0 else None
        if today_forecast:
            if today_forecast.get("temp_min") and today_forecast["temp_min"] < MIN_TEMP_THRESHOLD:
                tasks.append({
                    "title": "Monitor for frost risk",
                    "reason": f"Low temperature forecast ({today_forecast['temp_min']:.1f}°C)",
                    "priority": "high",
                    "block_id": None,
                    "tags": ["weather", "frost"]
                })
            
            if today_forecast.get("temp_max") and today_forecast["temp_max"] > MAX_TEMP_THRESHOLD:
                tasks.append({
                    "title": "Monitor for heat stress",
                    "reason": f"High temperature forecast ({today_forecast['temp_max']:.1f}°C)",
                    "priority": "medium",
                    "block_id": None,
                    "tags": ["weather", "heat"]
                })
            
            if today_forecast.get("precipitation_sum") and today_forecast["precipitation_sum"] > PRECIPITATION_THRESHOLD:
                tasks.append({
                    "title": "Check drainage after rain",
                    "reason": f"Significant rainfall expected ({today_forecast['precipitation_sum']:.1f}mm)",
                    "priority": "medium",
                    "block_id": None,
                    "tags": ["weather", "drainage"]
                })
    
    # Crop status based tasks
    if latest_status:
        # Mildew signs task
        if latest_status.mildew_signs:
            tasks.append({
                "title": "Re-scout for mildew",
                "reason": "Mildew signs detected in last check-in",
                "priority": "high",
                "block_id": latest_status.block_id,
                "tags": ["scouting", "disease"]
            })
        
        # Irrigation check based on status
        if latest_status.last_irrigation == "4plus_days":
            # Check if high heat is forecast
            if forecast.get("days") and len(forecast["days"]) > 0:
                max_temp = max([d.get("temp_max", 0) or 0 for d in forecast["days"][:3]])
                if max_temp > MAX_TEMP_THRESHOLD:
                    tasks.append({
                        "title": "Check irrigation needs",
                        "reason": "Last irrigation was 4+ days ago and high heat expected",
                        "priority": "high",
                        "block_id": latest_status.block_id,
                        "tags": ["irrigation"]
                    })
        
        # Spray record task
        if latest_status.last_spray == "dont_know":
            tasks.append({
                "title": "Record last spray (if any)",
                "reason": "Spray history needed for safety and planning",
                "priority": "medium",
                "block_id": latest_status.block_id,
                "tags": ["spray", "safety"]
            })
    
    # Irrigation tasks (from logs)
    if not recent_irrigation:
        tasks.append({
            "title": "Check irrigation needs",
            "reason": "No irrigation logged in the last 7 days",
            "priority": "medium",
            "block_id": None,
            "tags": ["irrigation"]
        })
    elif recent_irrigation[-1].irrigated_at.date() < three_days_ago:
        days_since = (today - recent_irrigation[-1].irrigated_at.date()).days
        tasks.append({
            "title": "Check irrigation needs",
            "reason": f"Last irrigation was {days_since} days ago",
            "priority": "medium",
            "block_id": None,
            "tags": ["irrigation"]
        })
    
    # Scouting tasks
    if not recent_scouting:
        tasks.append({
            "title": "Perform field scouting",
            "reason": "No scouting logged in the last 7 days",
            "priority": "high",
            "block_id": None,
            "tags": ["scouting"]
        })
    elif recent_scouting[-1].observed_at.date() < today - timedelta(days=SCOUTING_DAYS_SINCE):
        days_since = (today - recent_scouting[-1].observed_at.date()).days
        tasks.append({
            "title": "Perform field scouting",
            "reason": f"Last scouting was {days_since} days ago",
            "priority": "high",
            "block_id": None,
            "tags": ["scouting"]
        })
    
    # High severity issue follow-up
    high_severity_issues = [s for s in recent_scouting if s.severity >= HIGH_SEVERITY_ISSUE]
    for issue in high_severity_issues:
        days_since = (today - issue.observed_at.date()).days
        if days_since <= ISSUE_FOLLOWUP_DAYS:
            tasks.append({
                "title": f"Follow up on {issue.issue_type}",
                "reason": f"High severity issue detected {days_since} days ago",
                "priority": "high",
                "block_id": issue.block_id,
                "tags": ["scouting", "issue-followup"]
            })
    
    # Brix sampling
    if not recent_brix:
        tasks.append({
            "title": "Collect brix samples",
            "reason": "No brix samples logged in the last 7 days",
            "priority": "medium",
            "block_id": None,
            "tags": ["harvest", "quality"]
        })
    elif recent_brix[-1].sampled_at.date() < today - timedelta(days=BRIX_SAMPLING_DAYS_SINCE):
        days_since = (today - recent_brix[-1].sampled_at.date()).days
        tasks.append({
            "title": "Collect brix samples",
            "reason": f"Last brix sample was {days_since} days ago",
            "priority": "medium",
            "block_id": None,
            "tags": ["harvest", "quality"]
        })
    
    # Limit to 8 tasks
    return tasks[:8]

def _generate_insights(forecast: Dict, latest_status: Optional[CropStatus], today) -> List[Dict]:
    """Generate 7-day insights based on crop status and weather"""
    insights = []
    
    if not forecast.get("days") or len(forecast["days"]) == 0:
        return insights
    
    forecast_days = forecast["days"]
    
    # Insight 1: Harvest sweetness check
    if latest_status and latest_status.stage == "harvest" and latest_status.sweetness_brix is not None:
        if latest_status.sweetness_brix < HARVEST_BRIX_TARGET:
            # Find next 2 days window
            window = _get_date_window(forecast_days, 0, 1)
            insights.append({
                "title": "Sweetness low",
                "summary": f"Current Brix is {latest_status.sweetness_brix:.1f}°Bx (target: {HARVEST_BRIX_TARGET}°Bx). Check Brix again in 2 days; adjust irrigation timing; avoid stress spikes.",
                "risk": "medium",
                "window": window,
                "actions": [
                    "Check Brix again in 2 days",
                    "Adjust irrigation timing",
                    "Avoid stress spikes"
                ]
            })
    
    # Insight 2: Cracking risk
    has_cracking = latest_status and latest_status.cracking
    heavy_rain_days = [i for i, day in enumerate(forecast_days) 
                      if day.get("precipitation_sum", 0) and day["precipitation_sum"] > HEAVY_RAIN_THRESHOLD]
    
    if has_cracking or heavy_rain_days:
        # Find window with cracking or heavy rain
        risk_days = [0] if has_cracking else []
        risk_days.extend(heavy_rain_days)
        risk_days = sorted(set(risk_days))[:3]  # Up to 3 days
        
        if risk_days:
            window = _get_date_window(forecast_days, min(risk_days), max(risk_days))
            insights.append({
                "title": "Cracking risk window",
                "summary": "Cracking detected or heavy rain expected. Protect canopy and avoid sudden irrigation changes.",
                "risk": "high" if has_cracking else "medium",
                "window": window,
                "actions": [
                    "Scout for cracks",
                    "Protect canopy if possible",
                    "Avoid sudden irrigation changes"
                ]
            })
    
    # Insight 3: Mildew watch
    has_mildew = latest_status and latest_status.mildew_signs
    # Check for high humidity/rain pattern (simplified: use rain as proxy)
    rainy_days = [i for i, day in enumerate(forecast_days)
                  if day.get("precipitation_sum", 0) and day["precipitation_sum"] > 5.0]
    
    if has_mildew or (len(rainy_days) >= 2):
        risk_days = rainy_days[:5] if rainy_days else [0, 1, 2]
        window = _get_date_window(forecast_days, min(risk_days), min(max(risk_days), 6))
        insights.append({
            "title": "Mildew watch",
            "summary": "Mildew signs detected or humid/rainy conditions expected. Monitor closely and re-scout.",
            "risk": "high" if has_mildew else "medium",
            "window": window,
            "actions": [
                "Re-scout for mildew",
                "Monitor humidity",
                "Check canopy ventilation"
            ]
        })
    
    # Insight 4: Heat stress
    high_heat_days = [i for i, day in enumerate(forecast_days)
                     if day.get("temp_max") and day["temp_max"] > MAX_TEMP_THRESHOLD]
    
    if high_heat_days:
        window = _get_date_window(forecast_days, min(high_heat_days), 6)
        insights.append({
            "title": "Heat stress",
            "summary": f"High temperatures expected ({forecast_days[min(high_heat_days)]['temp_max']:.1f}°C+). Adjust irrigation timing to early morning or evening.",
            "risk": "medium",
            "window": window,
            "actions": [
                "Irrigate early morning or evening",
                "Monitor for sunburn",
                "Check canopy coverage"
            ]
        })
    
    return insights

def _get_date_window(forecast_days: List[Dict], start_idx: int, end_idx: Optional[int] = None) -> str:
    """Get a date window string like 'Mon-Tue' from forecast days"""
    if end_idx is None:
        end_idx = start_idx
    
    if start_idx >= len(forecast_days) or end_idx >= len(forecast_days):
        return "Next 7 days"
    
    start_date = forecast_days[start_idx].get("date", "")
    end_date = forecast_days[end_idx].get("date", "")
    
    if not start_date or not end_date:
        return "Next 7 days"
    
    try:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if start_idx == end_idx:
            return start_dt.strftime("%a")
        else:
            return f"{start_dt.strftime('%a')}-{end_dt.strftime('%a')}"
    except:
        return "Next 7 days"

def _summarize_weather(forecast: Dict) -> str:
    """Create a summary string of weather conditions"""
    if not forecast.get("days"):
        return "Weather data unavailable"
    
    days = forecast["days"]
    if len(days) == 0:
        return "No forecast data"
    
    today = days[0]
    temp_min = today.get("temp_min")
    temp_max = today.get("temp_max")
    precip = today.get("precipitation_sum")
    
    parts = []
    if temp_min is not None and temp_max is not None:
        parts.append(f"Temp: {temp_min:.1f}°C - {temp_max:.1f}°C")
    if precip is not None:
        parts.append(f"Rain: {precip:.1f}mm")
    
    return ", ".join(parts) if parts else "Weather data available"
