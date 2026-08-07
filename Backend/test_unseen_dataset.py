import os
import pickle
import warnings
import numpy as np
import pandas as pd

from generate_dataset import generate_mission_telemetry_dataset
from telemetry_ml.explainable_ai import MissionExplainableAI

warnings.filterwarnings("ignore")

def run_unseen_dataset_verification(test_csv="Dataset/unseen_test_dataset.csv", checkpoint_path="checkpoints/mission_models.pkl"):
    """
    Generates a completely UNSEEN test dataset (1,000 samples) and verifies model predictions,
    confidence, evidence attributions, and constraint violations against true ground truth.
    """
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Model checkpoint not found at {checkpoint_path}. Please run train_mission_models.py first.")

    # 1. Generate fresh unseen dataset
    print(f"Generating 1,000 completely UNSEEN test samples at {test_csv}...")
    generate_mission_telemetry_dataset(num_samples=1000, output_path=test_csv)

    # 2. Load trained pipeline assets
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

    # Load unseen dataset
    df_test = pd.read_csv(test_csv)
    X_test = df_test[feature_cols].copy()
    y_true_class = df_test["Failure_Class"].copy()

    X_scaled = scaler.transform(X_test)

    # 3. Model Inference
    probs = xgb_clf.predict_proba(X_scaled)
    pred_indices = np.argmax(probs, axis=1)
    confidences = np.max(probs, axis=1)
    pred_classes = label_encoder.inverse_transform(pred_indices)

    raw_scores = iso_forest.score_samples(X_scaled)
    anomaly_scores = np.clip(0.5 - raw_scores, 0.0, 1.0)

    # 4. Verify Matches
    correct_matches = (y_true_class.values == pred_classes)
    unseen_accuracy = np.mean(correct_matches) * 100.0

    print("\n" + "="*80)
    print("         UNSEEN DATASET VERIFICATION & PREDICTION ACCURACY REPORT")
    print("="*80)
    print(f"Total Unseen Test Samples:   {len(df_test)}")
    print(f"Overall Unseen Accuracy:     {unseen_accuracy:.2f}%")
    print("-" * 80)
    print("SAMPLE VERIFICATION RESULTS (Ground Truth vs Model Prediction):")
    print("-" * 80)
    print(f"{'ROW':<6} {'GROUND TRUTH CLASS':<26} {'MODEL PREDICTION':<26} {'CONF':<8} {'MATCH'}")
    print("-" * 80)

    unique_classes = df_test["Failure_Class"].unique()
    sample_rows = []
    for cls in unique_classes:
        matching_rows = df_test[df_test["Failure_Class"] == cls].index
        if len(matching_rows) > 0:
            sample_rows.append(matching_rows[0])

    for r_idx in sample_rows[:10]:
        gt = y_true_class.iloc[r_idx]
        pred = pred_classes[r_idx]
        conf = confidences[r_idx] * 100.0
        match_str = "[PASS]" if gt == pred else "[FAIL]"
        print(f"#{r_idx:<5} {gt:<26} {pred:<26} {conf:5.1f}%   {match_str}")

    print("-" * 80)

    # 5. Deep Inspection Card for 1 Random Anomaly Match
    anom_rows = [r for r in sample_rows if y_true_class.iloc[r] != "Healthy"]
    if anom_rows:
        deep_idx = anom_rows[0]
        sample_dict = df_test.iloc[deep_idx][feature_cols].to_dict()
        gt_cls = y_true_class.iloc[deep_idx]
        pred_cls = pred_classes[deep_idx]
        conf = confidences[deep_idx]
        anom_score = anomaly_scores[deep_idx]
        
        pred_bat = float(reg_battery.predict([X_scaled[deep_idx]])[0])
        pred_temp = float(reg_temp.predict([X_scaled[deep_idx]])[0])

        xai_card = xai_engine.generate_xai_card(
            sample_dict=sample_dict,
            failure_class=pred_cls,
            confidence=conf,
            remaining_battery=pred_bat,
            temp_30m=pred_temp,
            anomaly_score=anom_score
        )

        print(f"\nDEEP EXPLAINABLE AI VERIFICATION CARD FOR UNSEEN SAMPLE #{deep_idx}:")
        print("="*80)
        print(f"GROUND TRUTH CLASS:       {gt_cls}")
        print(f"MODEL PREDICTED CLASS:    {xai_card['Failure_Class']} (Confidence: {xai_card['Confidence']})")
        print(f"VERIFICATION STATUS:      {'[MATCHED CORRECTLY]' if gt_cls == pred_cls else '[MISMATCH]'}")
        print(f"ANOMALY SCORE:           {xai_card['Anomaly_Score']}")
        print("-" * 80)
        print("EXTRACTED EVIDENCE (Feature Attributions):")
        for ev in xai_card["Evidence"]:
            print(f"  * {ev}")
        print("-" * 80)
        if xai_card["Constraint_Violations"]:
            print("SAFETY CONSTRAINT VIOLATIONS DETECTED:")
            for viol in xai_card["Constraint_Violations"]:
                print(f"  [VIOLATION] {viol}")
            print("-" * 70)
        print(f"RECOMMENDED PROCEDURE:   {xai_card['Recommended_Procedure']}")
        print("="*80 + "\n")

if __name__ == "__main__":
    run_unseen_dataset_verification()
