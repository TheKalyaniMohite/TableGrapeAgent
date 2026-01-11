from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Farm
from app.schemas import FarmCreate, FarmResponse

router = APIRouter()

@router.post("", response_model=FarmResponse)
def create_farm(farm: FarmCreate, db: Session = Depends(get_db)):
    farm_data = farm.dict()
    # Set default name if not provided or empty
    if not farm_data.get("name") or not farm_data["name"].strip():
        farm_data["name"] = "My Farm"
    db_farm = Farm(**farm_data)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

