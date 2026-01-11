import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class GeocodeCache:
    def __init__(self, ttl_minutes: int = 15):
        self.cache: Dict[str, tuple] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self, key: str) -> Optional[List[Dict]]:
        if key in self.cache:
            data, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: List[Dict]):
        self.cache[key] = (data, datetime.now())

cache = GeocodeCache(ttl_minutes=15)

def normalize_country_code(country: str) -> Optional[str]:
    """
    Normalize country input to 2-letter ISO code when possible.
    Handles common variations like "USA", "United States", "US", "India", "IN", etc.
    """
    if not country:
        return None
    
    country_upper = country.strip().upper()
    
    # Common country code mappings
    country_map = {
        "USA": "US",
        "UNITED STATES": "US",
        "UNITED STATES OF AMERICA": "US",
        "UK": "GB",
        "UNITED KINGDOM": "GB",
        "GREAT BRITAIN": "GB",
        "INDIA": "IN",
    }
    
    if country_upper in country_map:
        return country_map[country_upper]
    
    # If already 2 letters, assume it's a code
    if len(country_upper) == 2:
        return country_upper
    
    # For longer names, try to match common patterns
    # This is a simple implementation - could be expanded
    return country_upper[:2] if len(country_upper) >= 2 else None

async def geocode_location(city: str, state: Optional[str] = None, country: Optional[str] = None, district: Optional[str] = None, count: int = 5) -> List[Dict]:
    """
    Geocode a location using Open-Meteo Geocoding API
    
    Args:
        city: City/Village/Town name (required) - used as 'name' parameter
        state: State/region name (optional) - used for ranking, not filtering
        country: Country name or code (optional) - normalized to country code
        district: District name (optional) - used for ranking, not filtering
        count: Maximum number of results (default 5)
    
    Returns:
        List of location matches with name, admin1, admin2, country, country_code, latitude, longitude, timezone
    """
    # Create cache key
    cache_key = f"{city}|{state or ''}|{country or ''}|{district or ''}|{count}"
    
    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": city.strip(),
            "count": count,
            "language": "en",
            "format": "json"
        }
        
        # Add country parameter if provided
        if country:
            normalized_country = normalize_country_code(country)
            if normalized_country:
                params["country"] = normalized_country
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Format results
            results = []
            locations = data.get("results", [])
            
            for loc in locations:
                results.append({
                    "name": loc.get("name", ""),
                    "admin1": loc.get("admin1", ""),  # State/region
                    "admin2": loc.get("admin2", ""),  # District
                    "country": loc.get("country", ""),
                    "country_code": loc.get("country_code", ""),
                    "latitude": loc.get("latitude", 0.0),
                    "longitude": loc.get("longitude", 0.0),
                    "timezone": loc.get("timezone", ""),
                })
            
            # Rank results by state and district matches (prefer matches, but don't filter)
            if (state or district) and results:
                state_upper = state.strip().upper() if state else ""
                district_upper = district.strip().upper() if district else ""
                
                def rank_key(loc: Dict) -> tuple:
                    admin1 = loc.get("admin1", "").upper()
                    admin2 = loc.get("admin2", "").upper()
                    
                    # Check for state match
                    admin1_match = False
                    if state_upper:
                        admin1_match = (
                            admin1 == state_upper or
                            state_upper in admin1 or
                            admin1 in state_upper
                        )
                    
                    # Check for district match
                    admin2_match = False
                    if district_upper:
                        admin2_match = (
                            admin2 == district_upper or
                            district_upper in admin2 or
                            admin2 in district_upper
                        )
                    
                    # Return tuple: (not state matched, not district matched, ...) so matches come first
                    return (not admin1_match, not admin2_match, loc.get("name", ""))
                
                results.sort(key=rank_key)
            
            # Cache the result
            cache.set(cache_key, results)
            return results
            
    except Exception as e:
        # Return empty list on error
        return []

