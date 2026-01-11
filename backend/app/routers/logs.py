from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ScoutingLog, IrrigationLog, BrixSample, SprayLog
from app.schemas import (
    ScoutingLogCreate, ScoutingLogResponse,
    IrrigationLogCreate, IrrigationLogResponse,
    BrixSampleCreate, BrixSampleResponse,
    SprayLogCreate, SprayLogResponse
)

router = APIRouter()

@router.post("/scouting", response_model=ScoutingLogResponse)
def create_scouting_log(log: ScoutingLogCreate, db: Session = Depends(get_db)):
    db_log = ScoutingLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/irrigation", response_model=IrrigationLogResponse)
def create_irrigation_log(log: IrrigationLogCreate, db: Session = Depends(get_db)):
    db_log = IrrigationLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/brix", response_model=BrixSampleResponse)
def create_brix_sample(sample: BrixSampleCreate, db: Session = Depends(get_db)):
    db_sample = BrixSample(**sample.dict())
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample

@router.post("/spray", response_model=SprayLogResponse)
def create_spray_log(log: SprayLogCreate, db: Session = Depends(get_db)):
    db_log = SprayLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


