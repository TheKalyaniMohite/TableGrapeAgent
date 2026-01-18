from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Block
from app.schemas import BlockCreate, BlockResponse
from typing import List, Optional

router = APIRouter()

@router.post("", response_model=BlockResponse)
def create_block(block: BlockCreate, db: Session = Depends(get_db)):
    db_block = Block(**block.dict())
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@router.get("", response_model=List[BlockResponse])
def get_blocks(farm_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Block)
    if farm_id:
        query = query.filter(Block.farm_id == farm_id)
    return query.all()






