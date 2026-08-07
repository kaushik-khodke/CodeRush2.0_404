import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
from routers import telemetry, predict, approval, mission, websocket, seeding, agentic
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Initializing Mission Control Database Schema...")
    try:
        await init_db()
        print("[Startup] Database Schema Initialized Successfully.")
    except Exception as e:
        print(f"[Startup Warning] Could not initialize DB tables automatically: {e}")
    yield
    print("[Shutdown] Mission Control Server Stopping...")

app = FastAPI(
    title="Spacecraft Telemetry ML & Supabase Mission Control API",
    description="Production-Grade Async FastAPI Server for Spacecraft Telemetry Monitoring, ML Inference, and Supabase Mission Database Integration",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router)
app.include_router(predict.router)
app.include_router(approval.router)
app.include_router(mission.router)
app.include_router(websocket.router)
app.include_router(seeding.router)
app.include_router(agentic.router)

@app.get("/")
async def root():
    return {
        "system": "SMOA Spacecraft Mission Control API",
        "status": "ONLINE",
        "version": "2.0.0",
        "database": "Supabase PostgreSQL Integrated",
        "ml_engine": "XGBoost + Isolation Forest Active"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
