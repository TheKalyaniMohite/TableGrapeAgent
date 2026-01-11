from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import CropStatus
from app.schemas import CropStatusCreate, CropStatusResponse
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.post("", response_model=CropStatusResponse)
def create_crop_status(status: CropStatusCreate, db: Session = Depends(get_db)):
    """Create a crop status check-in"""
    status_data = status.dict()
    # Set recorded_at to now if not provided
    if not status_data.get("recorded_at"):
        status_data["recorded_at"] = datetime.now()
    
    db_status = CropStatus(**status_data)
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status

@router.get("/latest", response_model=Optional[CropStatusResponse])
def get_latest_status(
    farm_id: str = Query(...),
    block_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get the most recent crop status for a farm (optionally filtered by block)"""
    query = db.query(CropStatus).filter(CropStatus.farm_id == farm_id)
    
    if block_id:
        query = query.filter(CropStatus.block_id == block_id)
    
    latest = query.order_by(CropStatus.recorded_at.desc()).first()
    
    if not latest:
        return None
    
    return latest


