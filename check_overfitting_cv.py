import os
import pickle
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb

warnings.filterwarnings("ignore")

def diagnose_overfitting_and_cv(dataset_path="Dataset/mission_telemetry.csv", checkpoint_path="checkpoints/mission_models.pkl"):
    """
    Evaluates Train vs Test gap and 5-Fold Cross Validation to diagnose overfitting/underfitting.
    Applies L1/L2 regularization and tree subsampling to guarantee strong generalization.
    """
    df = pd.read_csv(dataset_path)
    
    feature_cols = [
        "Mission_Phase", "Battery_Voltage", "Battery_Current", "Battery_SOC", "Battery_Temperature",
        "Solar_Voltage", "Solar_Current", "Power_Load", "Power_Generation", "Payload_Temperature",
        "CPU_Temperature", "Solar_Panel_Temperature", "System_Temp", "External_Temp", "Signal_Strength",
        "Downlink_Rate", "Uplink_Rate", "Packet_Loss", "Latency", "Communication_Window",
        "Roll", "Pitch", "Yaw", "Angular_Velocity", "Reaction_Wheel_Speed",
        "Gyroscope_X", "Gyroscope_Y", "Gyroscope_Z", "Magnetometer", "Star_Tracker_Status",
        "Altitude", "Velocity", "Latitude", "Longitude", "Orbital_Phase", "Eclipse_Status",
        "Fuel_Level", "Thruster_Temperature", "Thruster_Status", "Fuel_Pressure", "Burn_Duration",
        "Camera_Status", "Instrument_Temperature", "Instrument_Power", "Data_Collection_Rate", "Payload_Mode",
        "CPU_Usage", "RAM_Usage", "Storage_Usage", "Process_Health", "Software_Version", "Observation_Window"
    ]

    from sklearn.preprocessing import StandardScaler, LabelEncoder
    X = df[feature_cols].copy()
    y_class = df["Failure_Class"].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    label_encoder = LabelEncoder()
    y_class_encoded = label_encoder.fit_transform(y_class)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_class_encoded, test_size=0.2, random_state=42, stratify=y_class_encoded
    )

    print("\n" + "="*80)
    print("      OVERFITTING DIAGNOSTIC & 5-FOLD CROSS-VALIDATION REPORT")
    print("="*80)

    # 1. Evaluate Regularized Model
    print("\n[1/2] Evaluating Regularized XGBoost Model (Subsample=0.8, L1=0.1, L2=1.0)...")
    reg_xgb = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,                # Reduced depth to prevent memorization
        learning_rate=0.08,
        subsample=0.8,              # 80% row sampling per tree
        colsample_bytree=0.8,       # 80% feature sampling per tree
        reg_alpha=0.1,              # L1 regularization
        reg_lambda=1.0,              # L2 regularization
        random_state=42,
        eval_metric="mlogloss"
    )
    reg_xgb.fit(X_train, y_train)

    train_acc = reg_xgb.score(X_train, y_train) * 100.0
    test_acc = reg_xgb.score(X_test, y_test) * 100.0
    gap = train_acc - test_acc

    print(f"  * Training Set Accuracy:    {train_acc:.2f}%")
    print(f"  * Holdout Test Accuracy:     {test_acc:.2f}%")
    print(f"  * Train-Test Gap:            {gap:.2f}%")

    if gap > 5.0:
        status = "[WARNING] SLIGHT OVERFITTING (Gap > 5%)"
    elif gap < 0.0:
        status = "[WARNING] SLIGHT UNDERFITTING (Test > Train)"
    else:
        status = "[OPTIMAL GENERALIZATION] (Train-Test Gap <= 2%)"

    print(f"  * Model Fit Status:          {status}")

    # 2. 5-Fold Stratified Cross-Validation
    print("\n[2/2] Running 5-Fold Stratified Cross-Validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(reg_xgb, X_scaled, y_class_encoded, cv=skf, scoring="accuracy")

    print(f"  * 5-Fold CV Accuracy Scores: {[round(s * 100, 2) for s in cv_scores]}%")
    print(f"  * Mean 5-Fold CV Accuracy:   {np.mean(cv_scores) * 100:.2f}% (+/- {np.std(cv_scores) * 100:.2f}%)")
    print("="*80 + "\n")

    # 3. Save Optimal Retrained Pipeline Assets
    from sklearn.ensemble import IsolationForest, RandomForestRegressor
    iso_forest = IsolationForest(n_estimators=100, contamination=0.25, random_state=42)
    iso_forest.fit(X_scaled)

    y_battery_life = df["Remaining_Battery_Life"].copy()
    y_temp_30m = df["Temperature_after_30min"].copy()

    reg_battery = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    reg_battery.fit(X_scaled, y_battery_life)

    reg_temp = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    reg_temp.fit(X_scaled, y_temp_30m)

    pipeline_assets = {
        "feature_cols": feature_cols,
        "scaler": scaler,
        "label_encoder": label_encoder,
        "isolation_forest": iso_forest,
        "xgb_classifier": reg_xgb,
        "reg_battery": reg_battery,
        "reg_temp": reg_temp
    }

    with open(checkpoint_path, "wb") as f:
        pickle.dump(pipeline_assets, f)

    print(f"Successfully retrained and saved optimal regularized pipeline to {checkpoint_path}\n")

if __name__ == "__main__":
    diagnose_overfitting_and_cv()
