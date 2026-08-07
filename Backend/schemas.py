from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# All 52 Telemetry Input Parameters exactly matching ML feature names
class TelemetryInput(BaseModel):
    # Power Subsystem (8)
    Battery_Voltage: float = Field(..., description="Battery terminal voltage (V)")
    Battery_Current: float = Field(..., description="Battery current (A)")
    Battery_SOC: float = Field(..., ge=0.0, le=100.0, description="Battery state of charge (%)")
    Battery_Temperature: float = Field(..., description="Battery temperature (deg C)")
    Solar_Voltage: float = Field(..., description="Solar panel output voltage (V)")
    Solar_Current: float = Field(..., description="Solar panel current (A)")
    Power_Load: float = Field(..., description="Spacecraft load power (W)")
    Power_Generation: float = Field(..., description="Solar power generated (W)")

    # Thermal Subsystem (5)
    Payload_Temperature: float = Field(..., description="Payload temperature (deg C)")
    CPU_Temperature: float = Field(..., description="CPU temperature (deg C)")
    Solar_Panel_Temperature: float = Field(..., description="Solar panel temp (deg C)")
    System_Temp: float = Field(..., description="System cabin temp (deg C)")
    External_Temp: float = Field(..., description="External space temp (deg C)")

    # Communication Subsystem (6)
    Signal_Strength: float = Field(..., description="Received signal strength RSSI (dBm)")
    Downlink_Rate: float = Field(..., description="Downlink rate (Mbps)")
    Uplink_Rate: float = Field(..., description="Uplink rate (Mbps)")
    Packet_Loss: float = Field(..., ge=0.0, le=100.0, description="Packet loss rate (%)")
    Latency: float = Field(..., description="Downlink latency (ms)")
    Communication_Window: int = Field(..., ge=0, le=1, description="Ground station window (0 or 1)")

    # ADCS Subsystem (10)
    Roll: float = Field(..., description="Roll attitude (deg)")
    Pitch: float = Field(..., description="Pitch attitude (deg)")
    Yaw: float = Field(..., description="Yaw attitude (deg)")
    Angular_Velocity: float = Field(..., description="Angular velocity (deg/s)")
    Reaction_Wheel_Speed: float = Field(..., description="Reaction wheel speed (RPM)")
    Gyroscope_X: float = Field(..., description="Gyro X (rad/s)")
    Gyroscope_Y: float = Field(..., description="Gyro Y (rad/s)")
    Gyroscope_Z: float = Field(..., description="Gyro Z (rad/s)")
    Magnetometer: float = Field(..., description="Magnetometer field (uT)")
    Star_Tracker_Status: int = Field(..., ge=0, le=1, description="Star tracker status (0 or 1)")

    # Orbit Parameters (6)
    Altitude: float = Field(..., description="Orbital altitude (km)")
    Velocity: float = Field(..., description="Orbital velocity (km/s)")
    Latitude: float = Field(..., description="Sub-satellite latitude (deg)")
    Longitude: float = Field(..., description="Sub-satellite longitude (deg)")
    Orbital_Phase: float = Field(..., description="Orbital phase angle (deg)")
    Eclipse_Status: int = Field(..., ge=0, le=1, description="Eclipse indicator (0 or 1)")

    # Propulsion Subsystem (5)
    Fuel_Level: float = Field(..., ge=0.0, le=100.0, description="Fuel level remaining (%)")
    Thruster_Temperature: float = Field(..., description="Thruster temp (deg C)")
    Thruster_Status: int = Field(..., ge=0, le=1, description="Thruster firing status (0 or 1)")
    Fuel_Pressure: float = Field(..., description="Fuel tank pressure (PSI)")
    Burn_Duration: float = Field(..., description="Maneuver burn duration (s)")

    # Payload Subsystem (5)
    Camera_Status: int = Field(..., ge=0, le=1, description="Payload camera status (0 or 1)")
    Instrument_Temperature: float = Field(..., description="Instrument temp (deg C)")
    Instrument_Power: float = Field(..., description="Instrument power (W)")
    Data_Collection_Rate: float = Field(..., description="Data throughput (MB/s)")
    Payload_Mode: int = Field(..., ge=1, le=3, description="Payload mode (1, 2, or 3)")

    # Computer Health Subsystem (5)
    CPU_Usage: float = Field(..., ge=0.0, le=100.0, description="Processor usage (%)")
    RAM_Usage: float = Field(..., ge=0.0, le=100.0, description="RAM utilization (%)")
    Storage_Usage: float = Field(..., ge=0.0, le=100.0, description="Solid-state storage used (%)")
    Process_Health: int = Field(..., ge=0, le=1, description="Process health status (0 or 1)")
    Software_Version: float = Field(..., description="Flight software version")

    # Mission Parameters (2)
    Mission_Phase: int = Field(..., ge=1, le=3, description="Mission phase (1, 2, or 3)")
    Observation_Window: int = Field(..., ge=0, le=1, description="Observation opportunity (0 or 1)")

class TelemetryResponse(TelemetryInput):
    id: str
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class PredictiveMetricsSchema(BaseModel):
    Remaining_Battery_Life: str
    Est_CPU_Temp_30min: str

class XAICardSchema(BaseModel):
    Failure_Class: str
    Confidence: str
    Anomaly_Score: str
    Evidence: List[str]
    Constraint_Violations: List[str]
    Recommended_Procedure: str
    Estimated_Risk: str
    Predictive_Metrics: PredictiveMetricsSchema

class PredictionResponse(BaseModel):
    id: str
    telemetry_id: str
    timestamp: datetime
    failure_class: str
    confidence: float
    anomaly_score: float
    remaining_battery_life: float
    temperature_after_30min: float
    risk_level: str
    evidence: List[str]
    constraint_violations: List[str]
    recommended_procedure: str
    xai_card: Optional[XAICardSchema] = None

    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    approval_id: str
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    approved_by: Optional[str] = None
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    telemetry_id: str
    prediction_id: Optional[str] = None
    recommended_action: str
    status: str
    requested_by: Optional[str] = None
    approved_by: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MissionResponse(BaseModel):
    mission_name: str
    phase: str
    status: str
    target_orbit: str
    active_constraints_count: int
    latest_telemetry_id: Optional[str] = None
    latest_failure_class: Optional[str] = None

class ReplayResponse(BaseModel):
    total_samples: int
    telemetry_records: List[TelemetryResponse]
