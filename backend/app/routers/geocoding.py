from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.geocoding_service import geocode_location

router = APIRouter()

@router.get("/geocode")
async def get_geocode(
    city: str = Query(..., description="Village/Town/City name (required)"),
    state: Optional[str] = Query(None, description="State name (optional)"),
    country: Optional[str] = Query(None, description="Country name or code (optional)"),
    district: Optional[str] = Query(None, description="District name (optional)"),
    count: int = Query(5, ge=1, le=10, description="Maximum number of results")
):
    """
    Geocode a location to get coordinates
    
    - **city**: Village/Town/City name (required) - used as 'name' parameter
    - **state**: State name (optional) - used for ranking results
    - **country**: Country name or code (optional) - accepts "India", "IN", "USA", "US", etc.
    - **district**: District name (optional) - used for ranking results, not filtering
    - **count**: Maximum number of results (1-10, default 5)
    
    Returns a list of location matches with coordinates.
    """
    if not city or not city.strip():
        raise HTTPException(status_code=400, detail="City/Village/Town is required")
    
    results = await geocode_location(
        city=city.strip(),
        state=state.strip() if state else None,
        country=country.strip() if country else None,
        district=district.strip() if district else None,
        count=count
    )
    
    return {"results": results}

