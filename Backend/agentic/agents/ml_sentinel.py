from agentic.state import MissionGraphState
from agentic.schemas.sentinel_schema import MLSentinelOutput
from services.prediction_service import ml_service

def run_ml_sentinel_agent(state: MissionGraphState) -> MissionGraphState:
    """
    ML Sentinel Agent:
    Wrapper around trained XGBoost & Isolation Forest models.
    Returns failure class, confidence score, anomaly score, and boolean anomaly flag.
    NO LLM reasoning performed in this agent.
    """
    telemetry = state.get("telemetry_data", {})
    
    # Run exact ML inference pipeline
    pred_record, xai_card = ml_service.predict(telemetry)

    is_anomaly = bool(pred_record["failure_class"] != "Healthy" or pred_record["anomaly_score"] > 0.5)

    output = MLSentinelOutput(
        is_anomaly=is_anomaly,
        failure_class=pred_record["failure_class"],
        confidence=pred_record["confidence"],
        anomaly_score=pred_record["anomaly_score"]
    )

    state["ml_output"] = output.model_dump()
    state["is_anomaly"] = is_anomaly
    return state
