import os
import pickle
import logging
import numpy as np
from typing import Dict, Any
from agentic.graph.state import MissionGraphState

logger = logging.getLogger("MLSentinelAgent")

CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "checkpoints", "mission_models.pkl")

def run_ml_sentinel_agent(state: MissionGraphState) -> MissionGraphState:
    """
    2. ML Sentinel Agent:
    SOLE SOURCE OF TRUTH FOR ANOMALY DETECTION & CLASSIFICATION.
    Runs Isolation Forest & XGBoost Classifier models.
    Returns strictly: Failure Class, Confidence, Anomaly Score. Nothing else.
    """
    telemetry = state.get("telemetry_data", {})
    
    failure_class = "Healthy"
    confidence = 0.95
    anomaly_score = 0.10
    is_anomaly = False

    if os.path.exists(CHECKPOINT_PATH):
        try:
            with open(CHECKPOINT_PATH, "rb") as f:
                assets = pickle.load(f)

            feature_cols = assets["feature_cols"]
            scaler = assets["scaler"]
            label_encoder = assets["label_encoder"]
            iso_forest = assets["isolation_forest"]
            xgb_clf = assets["xgb_classifier"]

            X_sample = np.array([[telemetry.get(c, 0.0) for c in feature_cols]], dtype=float)
            X_scaled = scaler.transform(X_sample)

            # 1. Isolation Forest Anomaly Scoring
            raw_score = iso_forest.score_samples(X_scaled)[0]
            anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))

            # 2. XGBoost Failure Classification
            probs = xgb_clf.predict_proba(X_scaled)[0]
            pred_class_idx = np.argmax(probs)
            confidence = float(probs[pred_class_idx])
            failure_class = str(label_encoder.inverse_transform([pred_class_idx])[0])

            # Anomaly determination rule: Non-Healthy or anomaly score > 0.40
            if failure_class != "Healthy" or anomaly_score > 0.40:
                is_anomaly = True

        except Exception as e:
            logger.error(f"[MLSentinelAgent] Model inference warning: {e}")
            # Heuristic fallback if models not loaded
            if telemetry.get("Battery_SOC", 80) < 30.0:
                failure_class = "Battery Failure"
                anomaly_score = 0.92
                is_anomaly = True
            elif telemetry.get("CPU_Temperature", 45) > 70.0:
                failure_class = "Thermal Anomaly"
                anomaly_score = 0.88
                is_anomaly = True

    ml_sentinel_output = {
        "failure_class": failure_class,
        "confidence": round(confidence, 4),
        "anomaly_score": round(anomaly_score, 4)
    }

    state["ml_output"] = ml_sentinel_output
    state["is_anomaly"] = is_anomaly

    logger.info(f"[MLSentinelAgent] Classification: {failure_class} | Confidence: {confidence*100:.1f}% | Anomaly Score: {anomaly_score:.3f}")
    return state
