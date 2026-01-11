from fastapi import APIRouter, Query
from app.services.weather_service import get_forecast

router = APIRouter()

@router.get("/forecast")
async def get_weather_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=16, description="Number of forecast days")
):
    forecast = await get_forecast(lat, lon, days)
    return forecast


