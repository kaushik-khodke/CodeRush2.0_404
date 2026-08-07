import os
import pickle
import argparse
import warnings
import numpy as np
import pandas as pd
from telemetry_ml.explainable_ai import MissionExplainableAI

warnings.filterwarnings("ignore")

def predict_mission_telemetry(row_idx=None, csv_path="Dataset/mission_telemetry.csv", checkpoint_path="checkpoints/mission_models.pkl"):
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Model checkpoint not found at {checkpoint_path}. Please run train_mission_models.py first.")

    with open(checkpoint_path, "rb") as f:
        assets = pickle.load(f)

    feature_cols = assets["feature_cols"]
    scaler = assets["scaler"]
    label_encoder = assets["label_encoder"]
    iso_forest = assets["isolation_forest"]
    xgb_clf = assets["xgb_classifier"]
    reg_battery = assets["reg_battery"]
    reg_temp = assets["reg_temp"]

    xai_engine = MissionExplainableAI(feature_cols)

    df = pd.read_csv(csv_path)
    if row_idx is None:
        anom_rows = df[df["Failure_Class"] != "Healthy"]
        if len(anom_rows) > 0:
            sample_row = anom_rows.iloc[0]
            row_idx = sample_row.name
        else:
            row_idx = 0
            sample_row = df.iloc[row_idx]
    else:
        sample_row = df.iloc[row_idx]

    sample_dict = sample_row[feature_cols].to_dict()
    X_sample = np.array([sample_row[feature_cols].values], dtype=float)
    X_scaled = scaler.transform(X_sample)

    # 1. Anomaly Detection (Isolation Forest)
    raw_score = iso_forest.score_samples(X_scaled)[0]
    anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))

    # 2. XGBoost Failure Classification
    probs = xgb_clf.predict_proba(X_scaled)[0]
    pred_class_idx = np.argmax(probs)
    confidence = float(probs[pred_class_idx])
    pred_failure_class = label_encoder.inverse_transform([pred_class_idx])[0]

    # 3. Regression Predictions
    pred_battery_life = float(reg_battery.predict(X_scaled)[0])
    pred_temp_30m = float(reg_temp.predict(X_scaled)[0])

    # 4. Generate Explainable AI Card (PDF Section 7)
    xai_card = xai_engine.generate_xai_card(
        sample_dict=sample_dict,
        failure_class=pred_failure_class,
        confidence=confidence,
        remaining_battery=pred_battery_life,
        temp_30m=pred_temp_30m,
        anomaly_score=anomaly_score
    )

    print("\n" + "="*70)
    print(f"      EXPLAINABLE AI MISSION PREDICTION CARD (Row Index #{row_idx})")
    print("="*70)
    print(f"FAILURE CLASS:           {xai_card['Failure_Class']}")
    print(f"CONFIDENCE:              {xai_card['Confidence']}")
    print(f"ANOMALY SCORE:           {xai_card['Anomaly_Score']} (0.0=Normal, 1.0=Severe)")
    print(f"ESTIMATED RISK:          {xai_card['Estimated_Risk']}")
    print("-" * 70)
    print("EVIDENCE (Feature Vector Attributions):")
    for ev in xai_card["Evidence"]:
        print(f"  * {ev}")
    print("-" * 70)
    if xai_card["Constraint_Violations"]:
        print("SAFETY CONSTRAINT VIOLATIONS:")
        for viol in xai_card["Constraint_Violations"]:
            print(f"  [VIOLATION] {viol}")
        print("-" * 70)
    print(f"RECOMMENDED PROCEDURE:   {xai_card['Recommended_Procedure']}")
    print("-" * 70)
    print("PREDICTIVE METRICS:")
    print(f"  * Remaining Battery Life:   {xai_card['Predictive_Metrics']['Remaining_Battery_Life']}")
    print(f"  * Est CPU Temp (30 min):    {xai_card['Predictive_Metrics']['Est_CPU_Temp_30min']}")
    print("="*70 + "\n")

    return xai_card

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run PDF-Compliant Mission Telemetry Predictor")
    parser.add_argument("--row", type=int, default=None, help="Row index from Dataset/mission_telemetry.csv")
    args = parser.parse_args()
    predict_mission_telemetry(row_idx=args.row)
