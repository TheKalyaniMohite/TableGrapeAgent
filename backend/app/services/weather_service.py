import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import time

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
    """Fetch weather forecast from Open-Meteo API"""
    cache_key = f"{lat}_{lon}_{days}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    try:
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
            
            # Cache the result
            cache.set(cache_key, forecast)
            return forecast
            
    except Exception as e:
        # Return empty forecast on error
        return {
            "lat": lat,
            "lon": lon,
            "days": []
        }


