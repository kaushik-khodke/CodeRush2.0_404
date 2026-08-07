from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.repositories.telemetry_repo import TelemetryRepository
from database.repositories.prediction_repo import PredictionRepository
from database.repositories.anomaly_repo import AnomalyRepository
from database.repositories.audit_repo import AuditRepository
from schemas import TelemetryInput, PredictionResponse
from services.prediction_service import ml_service

router = APIRouter(tags=["Predictions & Anomalies"])

@router.post("/predict", response_model=PredictionResponse)
async def run_prediction(payload: Optional[TelemetryInput] = None, db: AsyncSession = Depends(get_db)):
    """
    Runs ML prediction on provided telemetry or the latest telemetry record.
    Stores prediction outputs, anomaly scores, and Explainable AI cards.
    """
    telemetry_repo = TelemetryRepository(db)
    prediction_repo = PredictionRepository(db)
    audit_repo = AuditRepository(db)

    if payload:
        telemetry_dict = payload.model_dump()
        telemetry = await telemetry_repo.create(telemetry_dict)
    else:
        telemetry = await telemetry_repo.get_latest()
        if not telemetry:
            raise HTTPException(status_code=404, detail="No telemetry available to run prediction on")
        
        # Convert ORM model to dictionary excluding internal metadata keys
        telemetry_dict = {
            col: getattr(telemetry, col)
            for col in ml_service.feature_cols
        }

    pred_data, xai_card = ml_service.predict(telemetry_dict)
    pred_data["telemetry_id"] = telemetry.id

    prediction = await prediction_repo.create(pred_data)

    await audit_repo.log(
        action="PREDICTION_EXECUTED",
        entity_type="predictions",
        entity_id=prediction.id,
        payload={"failure_class": prediction.failure_class, "risk": prediction.risk_level}
    )

    try:
        from database.repositories.supabase_repository import SupabaseRepository
        SupabaseRepository.insert_prediction(pred_data)
        SupabaseRepository.log_audit_event("PREDICTION_EXECUTED", "predictions", prediction.id, {"failure_class": prediction.failure_class})
    except Exception:
        pass

    response_dict = {
        "id": prediction.id,
        "telemetry_id": prediction.telemetry_id,
        "timestamp": prediction.timestamp,
        "failure_class": prediction.failure_class,
        "confidence": prediction.confidence,
        "anomaly_score": prediction.anomaly_score,
        "remaining_battery_life": prediction.remaining_battery_life,
        "temperature_after_30min": prediction.temperature_after_30min,
        "risk_level": prediction.risk_level,
        "evidence": prediction.evidence,
        "constraint_violations": prediction.constraint_violations,
        "recommended_procedure": prediction.recommended_procedure,
        "xai_card": xai_card
    }

    return response_dict

@router.get("/predictions", response_model=List[PredictionResponse])
async def list_predictions(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Retrieves historical prediction records.
    """
    prediction_repo = PredictionRepository(db)
    predictions = await prediction_repo.get_all(limit=limit)
    return predictions

@router.get("/anomalies")
async def list_anomalies(resolved: Optional[bool] = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Retrieves logged system anomalies.
    """
    anomaly_repo = AnomalyRepository(db)
    anomalies = await anomaly_repo.get_all(resolved=resolved, limit=limit)
    return anomalies
