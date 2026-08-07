from agentic.state import MissionGraphState
from agentic.schemas.telemetry_schema import TelemetryMonitorOutput

REQUIRED_52_PARAMS = [
    "Battery_Voltage", "Battery_Current", "Battery_SOC", "Battery_Temperature",
    "Solar_Voltage", "Solar_Current", "Power_Load", "Power_Generation",
    "Payload_Temperature", "CPU_Temperature", "Solar_Panel_Temperature", "System_Temp", "External_Temp",
    "Signal_Strength", "Downlink_Rate", "Uplink_Rate", "Packet_Loss", "Latency", "Communication_Window",
    "Roll", "Pitch", "Yaw", "Angular_Velocity", "Reaction_Wheel_Speed",
    "Gyroscope_X", "Gyroscope_Y", "Gyroscope_Z", "Magnetometer", "Star_Tracker_Status",
    "Altitude", "Velocity", "Latitude", "Longitude", "Orbital_Phase", "Eclipse_Status",
    "Fuel_Level", "Thruster_Temperature", "Thruster_Status", "Fuel_Pressure", "Burn_Duration",
    "Camera_Status", "Instrument_Temperature", "Instrument_Power", "Data_Collection_Rate", "Payload_Mode",
    "CPU_Usage", "RAM_Usage", "Storage_Usage", "Process_Health", "Software_Version",
    "Mission_Phase", "Observation_Window"
]

def run_telemetry_monitor_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Telemetry Monitor Agent:
    Validates telemetry quality, missing fields, and sampling health.
    Does NOT perform anomaly classification.
    """
    telemetry = state.get("telemetry_data", {})
    missing = [param for param in REQUIRED_52_PARAMS if param not in telemetry]
    
    timeouts = []
    if telemetry.get("Star_Tracker_Status", 1) == 0:
        timeouts.append("Star Tracker Celestial Lock Timeout")
    if telemetry.get("Communication_Window", 1) == 0:
        timeouts.append("Ground Station Line-of-Sight Window Out of Range")

    quality_score = max(0.0, 1.0 - (len(missing) / 52.0))

    trend_summary = {
        "Power_Subsystem": f"Voltage: {telemetry.get('Battery_Voltage', 28.0):.1f}V, SOC: {telemetry.get('Battery_SOC', 80.0):.1f}%",
        "Thermal_Subsystem": f"CPU Temp: {telemetry.get('CPU_Temperature', 45.0):.1f}C, Payload: {telemetry.get('Payload_Temperature', 25.0):.1f}C",
        "Propulsion_Subsystem": f"Fuel: {telemetry.get('Fuel_Level', 85.0):.1f}%, Temp: {telemetry.get('Thruster_Temperature', 40.0):.1f}C"
    }

    subsystems = {
        "Power": "NOMINAL" if telemetry.get("Battery_SOC", 80) > 30 else "DEGRADED",
        "Thermal": "NOMINAL" if telemetry.get("CPU_Temperature", 45) < 70 else "CRITICAL",
        "Propulsion": "NOMINAL" if telemetry.get("Fuel_Level", 85) > 10 else "WARNING",
        "ADCS": "NOMINAL" if telemetry.get("Star_Tracker_Status", 1) == 1 else "DEGRADED"
    }

    output = TelemetryMonitorOutput(
        data_quality_score=quality_score,
        missing_parameters=missing,
        sensor_timeouts=timeouts,
        trend_summary=trend_summary,
        subsystem_statuses=subsystems,
        context_prepared=True
    )

    state["telemetry_monitor_output"] = output.model_dump()
    return state
