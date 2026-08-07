import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest, RandomForestRegressor
import xgboost as xgb

from generate_dataset import generate_mission_telemetry_dataset

def train_mission_pipeline(dataset_path="Dataset/mission_telemetry.csv", checkpoint_path="checkpoints/mission_models.pkl"):
    os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
    
    # Always regenerate to ensure 100% parameter coverage matching PDF
    print(f"Generating 100% PDF Parameter Compliant Dataset at {dataset_path}...")
    generate_mission_telemetry_dataset(num_samples=10000, output_path=dataset_path)

    df = pd.read_csv(dataset_path)
    print(f"--- Loading Mission Telemetry Dataset ({df.shape[0]} rows, {df.shape[1]} columns) ---")

    # Full 50 Feature Vector X (All parameters from PDF Sections 1, 2, 5, 9)
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

    X = df[feature_cols].copy()
    y_class = df["Failure_Class"].copy()
    y_battery_life = df["Remaining_Battery_Life"].copy()
    y_temp_30m = df["Temperature_after_30min"].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    label_encoder = LabelEncoder()
    y_class_encoded = label_encoder.fit_transform(y_class)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_class_encoded, test_size=0.2, random_state=42, stratify=y_class_encoded
    )

    print("\n[1/3] Training Isolation Forest for Anomaly Detection (PDF Section 8)...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.25, random_state=42)
    iso_forest.fit(X_scaled)

    print("\n[2/3] Training XGBoost Classifier for Failure Classification (PDF Section 8 & 13)...")
    xgb_clf = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric="mlogloss"
    )
    xgb_clf.fit(X_train, y_train)

    train_acc = xgb_clf.score(X_train, y_train)
    test_acc = xgb_clf.score(X_test, y_test)
    print(f"XGBoost Failure Classifier Accuracy -> Train: {train_acc*100:.2f}% | Test: {test_acc*100:.2f}%")

    print("\n[3/3] Training Time-Series Regressors for Remaining Battery Life & Temp Prediction...")
    reg_battery = RandomForestRegressor(n_estimators=50, random_state=42)
    reg_battery.fit(X_scaled, y_battery_life)

    reg_temp = RandomForestRegressor(n_estimators=50, random_state=42)
    reg_temp.fit(X_scaled, y_temp_30m)

    pipeline_assets = {
        "feature_cols": feature_cols,
        "scaler": scaler,
        "label_encoder": label_encoder,
        "isolation_forest": iso_forest,
        "xgb_classifier": xgb_clf,
        "reg_battery": reg_battery,
        "reg_temp": reg_temp
    }

    with open(checkpoint_path, "wb") as f:
        pickle.dump(pipeline_assets, f)

    print(f"\nSuccessfully saved all 100% PDF-compliant ML models to {checkpoint_path}\n")

if __name__ == "__main__":
    train_mission_pipeline()
