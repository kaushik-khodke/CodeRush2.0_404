from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.repositories.mission_repo import MissionRepository
from database.repositories.telemetry_repo import TelemetryRepository
from database.repositories.prediction_repo import PredictionRepository
from schemas import MissionResponse, ReplayResponse, TelemetryResponse

router = APIRouter(tags=["Mission Operations"])

@router.get("/mission", response_model=MissionResponse)
async def get_mission_overview(db: AsyncSession = Depends(get_db)):
    """
    Returns high-level status of active space mission, orbit, and latest prediction state.
    """
    mission_repo = MissionRepository(db)
    telemetry_repo = TelemetryRepository(db)
    prediction_repo = PredictionRepository(db)

    active_plan = await mission_repo.get_active_plan()
    latest_telemetry = await telemetry_repo.get_latest()
    latest_prediction = await prediction_repo.get_latest()

    return {
        "mission_name": active_plan.mission_name if active_plan else "SMOA-Helios-1",
        "phase": active_plan.phase if active_plan else "MAPPING_OBSERVATION",
        "status": active_plan.status if active_plan else "ACTIVE",
        "target_orbit": active_plan.target_orbit if active_plan else "LEO Sun-Synchronous 520km",
        "active_constraints_count": 5,
        "latest_telemetry_id": latest_telemetry.id if latest_telemetry else None,
        "latest_failure_class": latest_prediction.failure_class if latest_prediction else "Healthy"
    }

@router.get("/replay", response_model=ReplayResponse)
async def get_mission_replay(limit: int = Query(100, ge=1, le=1000), db: AsyncSession = Depends(get_db)):
    """
    Retrieves time-series telemetry records for mission replay and timeline analysis.
    """
    telemetry_repo = TelemetryRepository(db)
    records = await telemetry_repo.get_history(limit=limit)

    return {
        "total_samples": len(records),
        "telemetry_records": [TelemetryResponse.model_validate(r) for r in records]
    }
