from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from database.repositories.telemetry_repo import TelemetryRepository
from database.repositories.prediction_repo import PredictionRepository
from database.repositories.anomaly_repo import AnomalyRepository
from database.repositories.approval_repo import ApprovalRepository
from database.repositories.audit_repo import AuditRepository
from schemas import TelemetryInput, TelemetryResponse
from services.prediction_service import ml_service
from routers.websocket import ws_manager

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.post("", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
async def create_telemetry(payload: TelemetryInput, db: AsyncSession = Depends(get_db)):
    """
    Stores incoming spacecraft telemetry (52 parameters), runs ML prediction,
    persists predictions & anomalies, creates approval queue items if required,
    and broadcasts updates via WebSockets.
    """
    telemetry_repo = TelemetryRepository(db)
    prediction_repo = PredictionRepository(db)
    anomaly_repo = AnomalyRepository(db)
    approval_repo = ApprovalRepository(db)
    audit_repo = AuditRepository(db)

    telemetry_dict = payload.model_dump()
    telemetry = await telemetry_repo.create(telemetry_dict)

    # Automatically run ML inference on incoming telemetry
    pred_data, xai_card = ml_service.predict(telemetry_dict)
    pred_data["telemetry_id"] = telemetry.id

    prediction = await prediction_repo.create(pred_data)

    # Log anomaly if failure detected or high anomaly score
    if prediction.failure_class != "Healthy" or prediction.anomaly_score > 0.5:
        anomaly = await anomaly_repo.create({
            "telemetry_id": telemetry.id,
            "prediction_id": prediction.id,
            "anomaly_type": prediction.failure_class,
            "severity": "CRITICAL" if prediction.failure_class != "Healthy" else "MEDIUM",
            "description": f"Telemetry anomaly detected: {prediction.failure_class}. Risk: {prediction.risk_level}"
        })

        # Create approval queue item if recommended procedure is non-nominal
        if "Continue Nominal" not in prediction.recommended_procedure:
            await approval_repo.create({
                "telemetry_id": telemetry.id,
                "prediction_id": prediction.id,
                "recommended_action": prediction.recommended_procedure,
                "status": "PENDING"
            })

    # Log audit entry
    await audit_repo.log(
        action="TELEMETRY_INGESTED",
        entity_type="telemetry_data",
        entity_id=telemetry.id,
        payload={"failure_class": prediction.failure_class, "confidence": prediction.confidence}
    )

    # Sync to Supabase directly if connected
    try:
        from database.repositories.supabase_repository import SupabaseRepository
        SupabaseRepository.insert_telemetry(telemetry_dict)
        SupabaseRepository.insert_prediction(pred_data)
        if prediction.failure_class != "Healthy" or prediction.anomaly_score > 0.5:
            SupabaseRepository.insert_anomaly({
                "telemetry_id": telemetry.id,
                "prediction_id": prediction.id,
                "anomaly_type": prediction.failure_class,
                "severity": "CRITICAL" if prediction.failure_class != "Healthy" else "MEDIUM",
                "description": f"Telemetry anomaly detected: {prediction.failure_class}. Risk: {prediction.risk_level}"
            })
        SupabaseRepository.log_audit_event("TELEMETRY_INGESTED", "telemetry_data", telemetry.id, {"failure_class": prediction.failure_class})
    except Exception as err:
        pass

    # Broadcast realtime event
    await ws_manager.broadcast({
        "event": "TELEMETRY_UPDATED",
        "telemetry_id": telemetry.id,
        "timestamp": telemetry.timestamp.isoformat() if telemetry.timestamp else None,
        "prediction": {
            "failure_class": prediction.failure_class,
            "confidence": f"{prediction.confidence * 100:.1f}%",
            "anomaly_score": prediction.anomaly_score,
            "risk_level": prediction.risk_level,
            "recommended_procedure": prediction.recommended_procedure
        }
    })

    return telemetry

@router.get("/latest", response_model=TelemetryResponse)
async def get_latest_telemetry(db: AsyncSession = Depends(get_db)):
    """
    Retrieves the most recent telemetry record from the database.
    """
    telemetry_repo = TelemetryRepository(db)
    telemetry = await telemetry_repo.get_latest()
    if not telemetry:
        raise HTTPException(status_code=404, detail="No telemetry records found in mission database")
    return telemetry
