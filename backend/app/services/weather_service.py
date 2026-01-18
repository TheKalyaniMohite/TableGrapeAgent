import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import time
import os
import logging

logger = logging.getLogger(__name__)

class WeatherCache:
    def __init__(self, ttl_minutes: int = 15):
        self.cache: Dict[str, tuple] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self, key: str) -> Optional[Dict]:
        if key in self.cache:
            data, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: Dict):
        self.cache[key] = (data, datetime.now())

cache = WeatherCache(ttl_minutes=15)

async def get_forecast(lat: float, lon: float, days: int = 7) -> Dict:
    """Fetch weather forecast from Google Weather API (with fallback to Open-Meteo)"""
    cache_key = f"{lat}_{lon}_{days}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Try Google Weather API first if API key is available
    google_api_key = os.getenv("GOOGLE_WEATHER_API_KEY")
    if google_api_key:
        try:
            forecast = await _get_google_forecast(lat, lon, days, google_api_key)
            if forecast and forecast.get("days"):
                cache.set(cache_key, forecast)
                return forecast
        except Exception as e:
            logger.warning(f"Google Weather API failed, falling back to Open-Meteo: {e}")
    
    # Fallback to Open-Meteo API
    try:
        forecast = await _get_openmeteo_forecast(lat, lon, days)
        if forecast:
            cache.set(cache_key, forecast)
            return forecast
    except Exception as e:
        logger.error(f"Open-Meteo API also failed: {e}")
    
    # Return empty forecast on error
    return {
        "lat": lat,
        "lon": lon,
        "days": []
    }


async def _get_google_forecast(lat: float, lon: float, days: int, api_key: str) -> Dict:
    """Fetch weather forecast from Google Weather API"""
    url = "https://weather.googleapis.com/v1/forecast/days:lookup"
    params = {
        "key": api_key,
        "location": f"{lat},{lon}",
        "days": min(days, 10)  # Google API supports up to 10 days
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        forecast = {
            "lat": lat,
            "lon": lon,
            "days": []
        }
        
        # Parse Google Weather API response
        # The response structure may vary, but typically includes dailyForecasts
        daily_forecasts = data.get("dailyForecasts", [])
        
        for day_data in daily_forecasts[:days]:
            # Extract date
            date_str = day_data.get("date", "")
            
            # Extract temperature (Google uses different field names)
            temp_data = day_data.get("temperature", {})
            temp_max = temp_data.get("max", temp_data.get("high", None))
            temp_min = temp_data.get("min", temp_data.get("low", None))
            
            # Extract precipitation
            precipitation = day_data.get("precipitation", {})
            precip_sum = precipitation.get("amount", precipitation.get("value", 0))
            
            forecast["days"].append({
                "date": date_str,
                "temp_min": temp_min,
                "temp_max": temp_max,
                "precipitation_sum": precip_sum
            })
        
        return forecast


async def _get_openmeteo_forecast(lat: float, lon: float, days: int) -> Dict:
    """Fetch weather forecast from Open-Meteo API (fallback)"""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_min,temperature_2m_max,precipitation_sum",
        "timezone": "auto",
        "forecast_days": days
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Format response
        daily = data.get("daily", {})
        forecast = {
            "lat": lat,
            "lon": lon,
            "days": []
        }
        
        dates = daily.get("time", [])
        temp_min = daily.get("temperature_2m_min", [])
        temp_max = daily.get("temperature_2m_max", [])
        precipitation = daily.get("precipitation_sum", [])
        
        for i in range(len(dates)):
            forecast["days"].append({
                "date": dates[i],
                "temp_min": temp_min[i] if i < len(temp_min) else None,
                "temp_max": temp_max[i] if i < len(temp_max) else None,
                "precipitation_sum": precipitation[i] if i < len(precipitation) else None
            })
        
        return forecast





