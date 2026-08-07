import sys
import json
import warnings
from pathlib import Path

# Add Backend root directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))

from agentic.graph import mission_graph

warnings.filterwarnings("ignore")

def test_nominal_flow():
    print("\n" + "="*80)
    print("      TEST 1: NOMINAL TELEMETRY FLOW (NO ANOMALY)")
    print("="*80)

    nominal_telemetry = {
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

    initial_state = {
        "telemetry_data": nominal_telemetry,
        "telemetry_history": [nominal_telemetry],
        "mission_phase": "MAPPING_OBSERVATION",
        "mission_state": "ACTIVE",
        "mission_constraints": {"Battery_SOC_Min": 30.0, "CPU_Temp_Max": 70.0},
        "mission_memory": [],
        "audit_logs": []
    }

    res = mission_graph.invoke(initial_state)

    print(f"  -> Is Anomaly Detected?      {res.get('is_anomaly')}")
    print(f"  -> ML Sentinel Output:       {res.get('ml_output')}")
    print(f"  -> Telemetry Quality Score:  {res.get('telemetry_monitor_output', {}).get('data_quality_score')}")

def test_anomaly_flow():
    print("\n" + "="*80)
    print("      TEST 2: BATTERY DEGRADATION ANOMALY FLOW")
    print("="*80)

    anomaly_telemetry = {
        "Battery_Voltage": 21.4, "Battery_Current": -2.1, "Battery_SOC": 32.1, "Battery_Temperature": 58.4,
        "Solar_Voltage": 18.2, "Solar_Current": 3.1, "Power_Load": 380.0, "Power_Generation": 80.0,
        "Payload_Temperature": 48.2, "CPU_Temperature": 78.4, "Solar_Panel_Temperature": 42.0, "System_Temp": 45.1, "External_Temp": -12.0,
        "Signal_Strength": -112.0, "Downlink_Rate": 2.1, "Uplink_Rate": 0.5, "Packet_Loss": 14.8, "Latency": 890.0, "Communication_Window": 1,
        "Roll": 4.8, "Pitch": -3.2, "Yaw": 2.1, "Angular_Velocity": 0.48, "Reaction_Wheel_Speed": 4850.0,
        "Gyroscope_X": 0.045, "Gyroscope_Y": -0.038, "Gyroscope_Z": 0.062, "Magnetometer": 88.4, "Star_Tracker_Status": 0,
        "Altitude": 518.2, "Velocity": 7.58, "Latitude": 14.1, "Longitude": -43.8, "Orbital_Phase": 215.0, "Eclipse_Status": 1,
        "Fuel_Level": 84.8, "Thruster_Temperature": 41.2, "Thruster_Status": 0, "Fuel_Pressure": 151.0, "Burn_Duration": 0.0,
        "Camera_Status": 0, "Instrument_Temperature": 48.5, "Instrument_Power": 0.0, "Data_Collection_Rate": 0.0, "Payload_Mode": 1,
        "CPU_Usage": 89.4, "RAM_Usage": 78.2, "Storage_Usage": 54.2, "Process_Health": 0, "Software_Version": 2.1,
        "Mission_Phase": 2, "Observation_Window": 1
    }

    initial_state = {
        "telemetry_data": anomaly_telemetry,
        "telemetry_history": [anomaly_telemetry],
        "mission_phase": "MAPPING_OBSERVATION",
        "mission_state": "ACTIVE",
        "mission_constraints": {"Battery_SOC_Min": 30.0, "CPU_Temp_Max": 70.0},
        "mission_memory": [],
        "audit_logs": []
    }

    res = mission_graph.invoke(initial_state)

    print("\n--- WORKFLOW EXECUTION RESULTS ---")
    print(f"  ✓ Anomaly Flag:               {res.get('is_anomaly')}")
    print(f"  ✓ ML Sentinel Classification: {res.get('ml_output', {}).get('failure_class')} (Conf: {res.get('ml_output', {}).get('confidence')*100:.1f}%)")
    print(f"  ✓ Consensus Output:           {res.get('consensus_output', {}).get('consensus_level')} (Ratio: {res.get('consensus_output', {}).get('agreement_ratio')*100:.1f}%)")
    print(f"  ✓ Trust Score:                {res.get('trust_evaluation', {}).get('composite_trust_score')}/100 ({res.get('trust_evaluation', {}).get('decision')})")
    print(f"  ✓ Diagnosis Root Cause:       {res.get('diagnosis_output', {}).get('root_cause')}")
    print(f"  ✓ Recommended Procedure:      {res.get('diagnosis_output', {}).get('recommended_procedure')}")
    print(f"  ✓ Flight Director Decision:   {res.get('flight_director_output', {}).get('final_recommendation')}")
    print(f"  ✓ Safety Agent Validation:    {res.get('safety_output', {}).get('status')} (Sig: {res.get('safety_output', {}).get('security_signature')[:24]}...)")
    print(f"  ✓ Warden Approval Queue:      {len(res.get('approval_queue', []))} Action(s) Queued")

if __name__ == "__main__":
    test_nominal_flow()
    test_anomaly_flow()
