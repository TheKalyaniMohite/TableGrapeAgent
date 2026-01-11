from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    country_code = Column(String, nullable=True)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Block(Base):
    __tablename__ = "blocks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    name = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    planting_year = Column(Integer, nullable=True)
    soil_type = Column(String, nullable=True)
    irrigation_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ScoutingLog(Base):
    __tablename__ = "scouting_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    photo_path = Column(String, nullable=True)
    issue_type = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)  # 0-3
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IrrigationLog(Base):
    __tablename__ = "irrigation_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)
    irrigated_at = Column(DateTime(timezone=True), nullable=False)
    amount_mm = Column(Float, nullable=True)
    duration_min = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BrixSample(Base):
    __tablename__ = "brix_samples"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)
    sampled_at = Column(DateTime(timezone=True), nullable=False)
    brix = Column(Float, nullable=False)
    firmness_score = Column(Integer, nullable=True)  # 1-5
    berry_size_mm = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SprayLog(Base):
    __tablename__ = "spray_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)
    sprayed_at = Column(DateTime(timezone=True), nullable=False)
    product_name = Column(String, nullable=True)
    target_issue = Column(String, nullable=True)
    phi_days = Column(Integer, nullable=True)  # Pre-harvest interval
    rei_hours = Column(Integer, nullable=True)  # Re-entry interval
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CropStatus(Base):
    __tablename__ = "crop_status"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    stage = Column(String, nullable=False)  # early_growth, flowering, fruit_set, veraison, harvest
    sweetness_brix = Column(Float, nullable=True)
    cracking = Column(Boolean, default=False)
    sunburn = Column(Boolean, default=False)
    mildew_signs = Column(Boolean, default=False)
    botrytis_signs = Column(Boolean, default=False)
    pest_signs = Column(Boolean, default=False)
    last_irrigation = Column(String, nullable=True)  # today, yesterday, 2_3_days, 4plus_days, dont_know
    last_spray = Column(String, nullable=True)  # none, fungus_spray, nutrient_spray, pest_spray, dont_know
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False, index=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")

