from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import farms, blocks, logs, weather, plan, geocoding, status, ai, scan, chat
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TableGrape Agent API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Include routers
app.include_router(farms.router, prefix="/api/farms", tags=["farms"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["blocks"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(plan.router, prefix="/api/plan", tags=["plan"])
app.include_router(geocoding.router, prefix="/api", tags=["geocoding"])
app.include_router(status.router, prefix="/api/status", tags=["status"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(scan.router, prefix="/api", tags=["scan"])
app.include_router(chat.router, prefix="/api", tags=["chat"])

@app.get("/health")
async def health():
    return {"status": "ok"}

