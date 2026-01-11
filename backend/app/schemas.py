from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Farm schemas
class FarmCreate(BaseModel):
    name: Optional[str] = None
    lat: float
    lon: float
    country_code: Optional[str] = None
    preferred_language: str = "en"

class FarmResponse(BaseModel):
    id: str
    name: Optional[str]
    lat: float
    lon: float
    country_code: Optional[str]
    preferred_language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Block schemas
class BlockCreate(BaseModel):
    farm_id: str
    name: str
    variety: Optional[str] = None
    planting_year: Optional[int] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class BlockResponse(BaseModel):
    id: str
    farm_id: str
    name: str
    variety: Optional[str]
    planting_year: Optional[int]
    soil_type: Optional[str]
    irrigation_type: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Scouting log schemas
class ScoutingLogCreate(BaseModel):
    farm_id: str
    block_id: Optional[str] = None
    observed_at: datetime
    photo_path: Optional[str] = None
    issue_type: str
    severity: int = Field(..., ge=0, le=3)
    notes: Optional[str] = None

class ScoutingLogResponse(BaseModel):
    id: str
    farm_id: str
    block_id: Optional[str]
    observed_at: datetime
    photo_path: Optional[str]
    issue_type: str
    severity: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Irrigation log schemas
class IrrigationLogCreate(BaseModel):
    farm_id: str
    block_id: Optional[str] = None
    irrigated_at: datetime
    amount_mm: Optional[float] = None
    duration_min: Optional[int] = None
    notes: Optional[str] = None

class IrrigationLogResponse(BaseModel):
    id: str
    farm_id: str
    block_id: Optional[str]
    irrigated_at: datetime
    amount_mm: Optional[float]
    duration_min: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Brix sample schemas
class BrixSampleCreate(BaseModel):
    farm_id: str
    block_id: Optional[str] = None
    sampled_at: datetime
    brix: float
    firmness_score: Optional[int] = Field(None, ge=1, le=5)
    berry_size_mm: Optional[float] = None
    notes: Optional[str] = None

class BrixSampleResponse(BaseModel):
    id: str
    farm_id: str
    block_id: Optional[str]
    sampled_at: datetime
    brix: float
    firmness_score: Optional[int]
    berry_size_mm: Optional[float]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Spray log schemas
class SprayLogCreate(BaseModel):
    farm_id: str
    block_id: Optional[str] = None
    sprayed_at: datetime
    product_name: Optional[str] = None
    target_issue: Optional[str] = None
    phi_days: Optional[int] = None
    rei_hours: Optional[int] = None
    notes: Optional[str] = None

class SprayLogResponse(BaseModel):
    id: str
    farm_id: str
    block_id: Optional[str]
    sprayed_at: datetime
    product_name: Optional[str]
    target_issue: Optional[str]
    phi_days: Optional[int]
    rei_hours: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Crop status schemas
class CropStatusCreate(BaseModel):
    farm_id: str
    block_id: Optional[str] = None
    recorded_at: Optional[datetime] = None
    stage: Literal["early_growth", "flowering", "fruit_set", "veraison", "harvest"]
    sweetness_brix: Optional[float] = None
    cracking: bool = False
    sunburn: bool = False
    mildew_signs: bool = False
    botrytis_signs: bool = False
    pest_signs: bool = False
    last_irrigation: Optional[Literal["today", "yesterday", "2_3_days", "4plus_days", "dont_know"]] = None
    last_spray: Optional[Literal["none", "fungus_spray", "nutrient_spray", "pest_spray", "dont_know"]] = None
    notes: Optional[str] = None

class CropStatusResponse(BaseModel):
    id: str
    farm_id: str
    block_id: Optional[str]
    recorded_at: datetime
    stage: str
    sweetness_brix: Optional[float]
    cracking: bool
    sunburn: bool
    mildew_signs: bool
    botrytis_signs: bool
    pest_signs: bool
    last_irrigation: Optional[str]
    last_spray: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Chat message schemas
class ChatMessageCreate(BaseModel):
    farm_id: str
    message: str
    lang: Optional[str] = "en"

class ChatMessageResponse(BaseModel):
    id: str
    farm_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageRequest(BaseModel):
    farm_id: str
    message: str
    lang: Optional[str] = "en"

class ChatMessageReply(BaseModel):
    reply: str

