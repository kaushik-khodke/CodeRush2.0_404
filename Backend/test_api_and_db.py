import asyncio
import warnings
from database.db import init_db, AsyncSessionLocal
from database.repositories.telemetry_repo import TelemetryRepository
from database.repositories.prediction_repo import PredictionRepository
from database.repositories.approval_repo import ApprovalRepository
from database.repositories.mission_repo import MissionRepository
from database.repositories.anomaly_repo import AnomalyRepository
from services.prediction_service import ml_service

warnings.filterwarnings("ignore")

async def test_backend_integration():
    print("=" * 80)
    print("        TESTING SUPABASE & FASTAPI BACKEND INTEGRATION")
    print("=" * 80)

    # 1. Init Database Schema
    print("[1/5] Initializing Database Schema...")
    await init_db()
    print("  -> Schema initialized successfully.")

    # 2. Test ML Prediction Engine Integrity
    print("\n[2/5] Testing ML Prediction Service Inferences...")
    sample_telemetry = {
        "Battery_Voltage": 28.2, "Battery_Current": 4.8, "Battery_SOC": 88.5, "Battery_Temperature": 24.1,
        "Solar_Voltage": 36.4, "Solar_Current": 12.5, "Power_Load": 245.0, "Power_Generation": 410.0,
        "Payload_Temperature": 29.5, "CPU_Temperature": 43.2, "Solar_Panel_Temperature": 12.0, "System_Temp": 27.8, "External_Temp": -52.0,
        "Signal_Strength": -78.5, "Downlink_Rate": 24.8, "Uplink_Rate": 2.1, "Packet_Loss": 0.1, "Latency": 115.0, "Communication_Window": 1,
        "Roll": 0.2, "Pitch": -0.1, "Yaw": 0.05, "Angular_Velocity": 0.04, "Reaction_Wheel_Speed": 2480.0,
        "Gyroscope_X": 0.0009, "Gyroscope_Y": 0.0011, "Gyroscope_Z": 0.0008, "Magnetometer": 44.8, "Star_Tracker_Status": 1,
        "Altitude": 521.4, "Velocity": 7.62, "Latitude": 12.4, "Longitude": -45.2, "Orbital_Phase": 120.0, "Eclipse_Status": 0,
        "Fuel_Level": 85.0, "Thruster_Temperature": 39.5, "Thruster_Status": 0, "Fuel_Pressure": 152.0, "Burn_Duration": 0.0,
        "Camera_Status": 1, "Instrument_Temperature": 21.8, "Instrument_Power": 84.0, "Data_Collection_Rate": 10.2, "Payload_Mode": 2,
        "CPU_Usage": 34.2, "RAM_Usage": 39.8, "Storage_Usage": 54.1, "Process_Health": 1, "Software_Version": 2.1,
        "Mission_Phase": 2, "Observation_Window": 1
    }

    pred_record, xai_card = ml_service.predict(sample_telemetry)
    print(f"  -> Predicted Failure Class: {pred_record['failure_class']}")
    print(f"  -> Prediction Confidence:   {pred_record['confidence']*100:.1f}%")
    print(f"  -> Anomaly Score:            {pred_record['anomaly_score']:.3f}")
    print(f"  -> Recommended Procedure:    {pred_record['recommended_procedure']}")

    # 3. Test Repository Database Operations
    print("\n[3/5] Testing Repository DB Persistence...")
    async with AsyncSessionLocal() as session:
        telemetry_repo = TelemetryRepository(session)
        prediction_repo = PredictionRepository(session)
        approval_repo = ApprovalRepository(session)
        anomaly_repo = AnomalyRepository(session)

        # Store Telemetry
        telemetry = await telemetry_repo.create(sample_telemetry)
        print(f"  -> Telemetry record saved to DB with ID: {telemetry.id}")

        # Store Prediction
        pred_record["telemetry_id"] = telemetry.id
        prediction = await prediction_repo.create(pred_record)
        print(f"  -> Prediction record saved to DB with ID: {prediction.id}")

        # Store Approval Item
        approval = await approval_repo.create({
            "telemetry_id": telemetry.id,
            "prediction_id": prediction.id,
            "recommended_action": prediction.recommended_procedure,
            "status": "PENDING"
        })
        print(f"  -> Approval Queue item created with ID: {approval.id}")

        # Process Approval
        updated_approval = await approval_repo.update_status(
            approval_id=approval.id,
            status="APPROVED",
            approved_by="Dr. Sarah Vance",
            comments="Verified telemetry parameters within nominal ranges."
        )
        print(f"  -> Approval item updated status: {updated_approval.status}")

    # 4. Verify Latest Telemetry Retrieval
    print("\n[4/5] Testing Latest Telemetry & History Query...")
    async with AsyncSessionLocal() as session:
        telemetry_repo = TelemetryRepository(session)
        latest = await telemetry_repo.get_latest()
        history = await telemetry_repo.get_history(limit=5)
        print(f"  -> Latest Telemetry Timestamp: {latest.timestamp}")
        print(f"  -> Retrieved {len(history)} historical records.")

    print("\n[5/5] All Backend Tests Completed Successfully!")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    asyncio.run(test_backend_integration())
