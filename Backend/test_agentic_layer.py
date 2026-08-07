import json
import warnings
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
    print(f"  -> Diagnosis Triggered?     {'Yes' if res.get('diagnosis_output') else 'No (Bypassed cleanly for nominal telemetry)'}")

def test_anomaly_agentic_flow():
    print("\n" + "="*80)
    print("      TEST 2: HYBRID AGENTIC PIPELINE (ML SENTINEL + LLM FACTORY + CONSENSUS + TRUST + WARDEN)")
    print("="*80)

    # Battery Failure Anomaly Payload
    anomalous_telemetry = {
        "Battery_Voltage": 18.4, "Battery_Current": 18.2, "Battery_SOC": 14.5, "Battery_Temperature": 58.2,
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
        "telemetry_data": anomalous_telemetry,
        "telemetry_history": [anomalous_telemetry],
        "mission_phase": "MAPPING_OBSERVATION",
        "mission_state": "ACTIVE",
        "mission_constraints": {"Battery_SOC_Min": 30.0, "CPU_Temp_Max": 70.0},
        "mission_memory": [],
        "audit_logs": []
    }

    res = mission_graph.invoke(initial_state)

    print(f"\n[1] ML Sentinel Output:          {res.get('ml_output')}")
    print(f"\n[2] Multi-LLM Providers Responded: {len(res.get('llm_responses', []))}")
    print(f"\n[3] Consensus Engine Result:    Status: {res.get('consensus_output', {}).get('consensus_status')} | Ratio: {res.get('consensus_output', {}).get('agreement_ratio')*100:.0f}%")
    print(f"                                Explanation: {res.get('consensus_output', {}).get('consensus_explanation')}")
    print(f"\n[4] Trust Engine Composite Score: {res.get('trust_evaluation', {}).get('trust_score')}/100 -> Gate Decision: {res.get('trust_evaluation', {}).get('decision_gate')}")
    print(f"\n[5] Diagnosis Agent Output:       Root Cause: {res.get('diagnosis_output', {}).get('root_cause')}")
    print(f"                                Severity:   {res.get('diagnosis_output', {}).get('severity')}")
    print(f"\n[6] Archivist Agent (RAG):       Active SOP: {res.get('archivist_output', {}).get('active_sop')}")
    print(f"\n[7] Future Digital Twin Sim:     Prob:       {res.get('simulation_output', {}).get('success_probability')*100:.1f}% | Pass: {res.get('simulation_output', {}).get('simulation_passed')}")
    print(f"\n[8] Mission Planner (OR-Tools):  Power Alloc:{res.get('planner_output', {}).get('optimized_power_load_w')}W | Next AOS: {res.get('planner_output', {}).get('next_contact_window')}")
    print(f"\n[9] Flight Director Card:       Recommendation: {res.get('flight_director_output', {}).get('primary_recommendation')}")
    print(f"\n[10] Safety & Security Audit:   Status:     {res.get('safety_output', {}).get('security_status')} | Threat: {res.get('safety_output', {}).get('threat_level')} | Signature: {res.get('safety_output', {}).get('security_signature')}")
    print(f"\n[11] Warden Safety Gate:        Status:     {res.get('approval_status')}")
    print(f"                                Queued CMD: {res.get('warden_output', {}).get('queued_command_id')} (Auto-Execution: {res.get('warden_output', {}).get('execution_allowed')})")

    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    test_nominal_flow()
    test_anomaly_agentic_flow()
