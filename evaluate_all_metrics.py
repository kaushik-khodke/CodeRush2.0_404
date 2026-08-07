import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_recall_fscore_support, mean_absolute_error,
    mean_squared_error, r2_score, roc_auc_score
)

warnings.filterwarnings("ignore")

def evaluate_full_performance_suite(dataset_path="Dataset/mission_telemetry.csv", checkpoint_path="checkpoints/mission_models.pkl"):
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

    df = pd.read_csv(dataset_path)
    X = df[feature_cols].copy()
    y_class = df["Failure_Class"].copy()
    y_battery_life = df["Remaining_Battery_Life"].copy()
    y_temp_30m = df["Temperature_after_30min"].copy()

    X_scaled = scaler.transform(X)
    y_class_encoded = label_encoder.transform(y_class)

    # Train / Test split matching train_mission_models.py seed
    X_train, X_test, y_train, y_test, y_bat_train, y_bat_test, y_temp_train, y_temp_test = train_test_split(
        X_scaled, y_class_encoded, y_battery_life, y_temp_30m, test_size=0.2, random_state=42, stratify=y_class_encoded
    )

    print("\n" + "="*75)
    print("        COMPREHENSIVE PERFORMANCE EVALUATION METRICS REPORT")
    print("="*75)

    # 1. Failure Classification Performance (XGBoost)
    y_pred_test = xgb_clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred_test)
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred_test, average="macro")

    print("\n1. MULTICLASS FAILURE CLASSIFIER METRICS (XGBoost)")
    print("-" * 75)
    print(f"  • Overall Test Accuracy:     {acc * 100:.2f}%")
    print(f"  • Macro Precision:           {macro_prec * 100:.2f}%")
    print(f"  • Macro Recall:              {macro_rec * 100:.2f}%")
    print(f"  • Macro F1-Score:            {macro_f1 * 100:.2f}%")
    print("-" * 75)
    print("DETAILED PER-CLASS CLASSIFICATION REPORT:")
    class_names = label_encoder.classes_
    clf_report = classification_report(y_test, y_pred_test, target_names=class_names, digits=3)
    print(clf_report)

    # 2. Time-Series Regression Performance
    y_bat_pred = reg_battery.predict(X_test)
    bat_mae = mean_absolute_error(y_bat_test, y_bat_pred)
    bat_rmse = np.sqrt(mean_squared_error(y_bat_test, y_bat_pred))
    bat_r2 = r2_score(y_bat_test, y_bat_pred)

    y_temp_pred = reg_temp.predict(X_test)
    temp_mae = mean_absolute_error(y_temp_test, y_temp_pred)
    temp_rmse = np.sqrt(mean_squared_error(y_temp_test, y_temp_pred))
    temp_r2 = r2_score(y_temp_test, y_temp_pred)

    print("\n2. TIME-SERIES REGRESSION METRICS")
    print("-" * 75)
    print("  • Remaining Battery Life Predictor:")
    print(f"      MAE:   {bat_mae:.4f} hours")
    print(f"      RMSE:  {bat_rmse:.4f} hours")
    print(f"      R²:    {bat_r2 * 100:.2f}%")
    print("  • 30-Min CPU Temperature Predictor:")
    print(f"      MAE:   {temp_mae:.4f} deg C")
    print(f"      RMSE:  {temp_rmse:.4f} deg C")
    print(f"      R²:    {temp_r2 * 100:.2f}%")

    # 3. Anomaly Detection Performance (Isolation Forest)
    y_binary_true = (y_test != label_encoder.transform(["Healthy"])[0]).astype(int)
    raw_scores = iso_forest.score_samples(X_test)
    anomaly_scores = np.clip(0.5 - raw_scores, 0.0, 1.0)
    roc_auc = roc_auc_score(y_binary_true, anomaly_scores)

    print("\n3. UNKNOWN ANOMALY DETECTION METRICS (Isolation Forest)")
    print("-" * 75)
    print(f"  • ROC-AUC Score:             {roc_auc * 100:.2f}%")
    print("="*75 + "\n")

if __name__ == "__main__":
    evaluate_full_performance_suite()
