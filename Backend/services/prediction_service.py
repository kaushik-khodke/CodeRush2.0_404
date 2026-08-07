import os
import pickle
import numpy as np
from typing import Dict, Any, Tuple
from telemetry_ml.explainable_ai import MissionExplainableAI

class MLPredictionService:
    """
    Service wrapper around pre-trained spacecraft telemetry ML pipeline.
    Does NOT modify model checkpoints or retraining logic.
    """
    def __init__(self, checkpoint_path: str = "checkpoints/mission_models.pkl"):
        self.checkpoint_path = checkpoint_path
        self.assets = None
        self.xai_engine = None
        self._load_models()

    def _load_models(self):
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"Model checkpoint not found at {self.checkpoint_path}. Run train_mission_models.py first.")

        with open(self.checkpoint_path, "rb") as f:
            self.assets = pickle.load(f)

        self.feature_cols = self.assets["feature_cols"]
        self.scaler = self.assets["scaler"]
        self.label_encoder = self.assets["label_encoder"]
        self.iso_forest = self.assets["isolation_forest"]
        self.xgb_clf = self.assets["xgb_classifier"]
        self.reg_battery = self.assets["reg_battery"]
        self.reg_temp = self.assets["reg_temp"]

        self.xai_engine = MissionExplainableAI(self.feature_cols)

    def predict(self, sample_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        # Extract features vector in exact trained column order
        X_raw = np.array([[sample_dict[col] for col in self.feature_cols]], dtype=float)
        X_scaled = self.scaler.transform(X_raw)

        # 1. Isolation Forest Anomaly Score
        raw_score = self.iso_forest.score_samples(X_scaled)[0]
        anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))

        # 2. XGBoost Failure Classification & Confidence
        probs = self.xgb_clf.predict_proba(X_scaled)[0]
        pred_class_idx = int(np.argmax(probs))
        confidence = float(probs[pred_class_idx])
        pred_failure_class = str(self.label_encoder.inverse_transform([pred_class_idx])[0])

        # 3. Regression Targets
        pred_battery_life = float(self.reg_battery.predict(X_scaled)[0])
        pred_temp_30m = float(self.reg_temp.predict(X_scaled)[0])

        # 4. Generate Explainable AI Output Card
        xai_card = self.xai_engine.generate_xai_card(
            sample_dict=sample_dict,
            failure_class=pred_failure_class,
            confidence=confidence,
            remaining_battery=pred_battery_life,
            temp_30m=pred_temp_30m,
            anomaly_score=anomaly_score
        )

        prediction_record = {
            "failure_class": pred_failure_class,
            "confidence": confidence,
            "anomaly_score": anomaly_score,
            "remaining_battery_life": pred_battery_life,
            "temperature_after_30min": pred_temp_30m,
            "risk_level": xai_card["Estimated_Risk"],
            "evidence": xai_card["Evidence"],
            "constraint_violations": xai_card["Constraint_Violations"],
            "recommended_procedure": xai_card["Recommended_Procedure"]
        }

        return prediction_record, xai_card

# Singleton instance
ml_service = MLPredictionService()
