import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database.db import Base

# Helper to support UUID across SQLite and Postgres
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="operator")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class MissionConstraint(Base):
    __tablename__ = "mission_constraints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parameter_name = Column(String(100), unique=True, nullable=False)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    is_critical = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class MissionPlan(Base):
    __tablename__ = "mission_plan"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_name = Column(String(255), nullable=False)
    phase = Column(String(50), nullable=False, default="ORBIT_INSERTION")
    status = Column(String(50), nullable=False, default="ACTIVE")
    target_orbit = Column(String(100), nullable=False, default="LEO 520km")
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class TelemetryData(Base):
    __tablename__ = "telemetry_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Power Subsystem (8)
    Battery_Voltage = Column(Float, nullable=False)
    Battery_Current = Column(Float, nullable=False)
    Battery_SOC = Column(Float, nullable=False)
    Battery_Temperature = Column(Float, nullable=False)
    Solar_Voltage = Column(Float, nullable=False)
    Solar_Current = Column(Float, nullable=False)
    Power_Load = Column(Float, nullable=False)
    Power_Generation = Column(Float, nullable=False)

    # Thermal Subsystem (5)
    Payload_Temperature = Column(Float, nullable=False)
    CPU_Temperature = Column(Float, nullable=False)
    Solar_Panel_Temperature = Column(Float, nullable=False)
    System_Temp = Column(Float, nullable=False)
    External_Temp = Column(Float, nullable=False)

    # Communication Subsystem (6)
    Signal_Strength = Column(Float, nullable=False)
    Downlink_Rate = Column(Float, nullable=False)
    Uplink_Rate = Column(Float, nullable=False)
    Packet_Loss = Column(Float, nullable=False)
    Latency = Column(Float, nullable=False)
    Communication_Window = Column(Integer, nullable=False)

    # ADCS Subsystem (10)
    Roll = Column(Float, nullable=False)
    Pitch = Column(Float, nullable=False)
    Yaw = Column(Float, nullable=False)
    Angular_Velocity = Column(Float, nullable=False)
    Reaction_Wheel_Speed = Column(Float, nullable=False)
    Gyroscope_X = Column(Float, nullable=False)
    Gyroscope_Y = Column(Float, nullable=False)
    Gyroscope_Z = Column(Float, nullable=False)
    Magnetometer = Column(Float, nullable=False)
    Star_Tracker_Status = Column(Integer, nullable=False)

    # Orbit Parameters (6)
    Altitude = Column(Float, nullable=False)
    Velocity = Column(Float, nullable=False)
    Latitude = Column(Float, nullable=False)
    Longitude = Column(Float, nullable=False)
    Orbital_Phase = Column(Float, nullable=False)
    Eclipse_Status = Column(Integer, nullable=False)

    # Propulsion Subsystem (5)
    Fuel_Level = Column(Float, nullable=False)
    Thruster_Temperature = Column(Float, nullable=False)
    Thruster_Status = Column(Integer, nullable=False)
    Fuel_Pressure = Column(Float, nullable=False)
    Burn_Duration = Column(Float, nullable=False)

    # Payload Subsystem (5)
    Camera_Status = Column(Integer, nullable=False)
    Instrument_Temperature = Column(Float, nullable=False)
    Instrument_Power = Column(Float, nullable=False)
    Data_Collection_Rate = Column(Float, nullable=False)
    Payload_Mode = Column(Integer, nullable=False)

    # Computer Health Subsystem (5)
    CPU_Usage = Column(Float, nullable=False)
    RAM_Usage = Column(Float, nullable=False)
    Storage_Usage = Column(Float, nullable=False)
    Process_Health = Column(Integer, nullable=False)
    Software_Version = Column(Float, nullable=False)

    # Mission Parameters (2)
    Mission_Phase = Column(Integer, nullable=False)
    Observation_Window = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    telemetry_id = Column(String(36), ForeignKey("telemetry_data.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    failure_class = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    remaining_battery_life = Column(Float, nullable=False)
    temperature_after_30min = Column(Float, nullable=False)
    risk_level = Column(String(20), default="Low", nullable=False)
    evidence = Column(JSON, nullable=False, default=list)
    constraint_violations = Column(JSON, nullable=False, default=list)
    recommended_procedure = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    telemetry = relationship("TelemetryData", backref="predictions")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    telemetry_id = Column(String(36), ForeignKey("telemetry_data.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(String(36), ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False)
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    steps = Column(JSON, nullable=False, default=list)
    safety_precautions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ApprovalQueue(Base):
    __tablename__ = "approval_queue"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    telemetry_id = Column(String(36), ForeignKey("telemetry_data.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(String(36), ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True)
    procedure_id = Column(String(36), ForeignKey("procedures.id", ondelete="SET NULL"), nullable=True)
    recommended_action = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)
    requested_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(36), nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class MissionMemory(Base):
    __tablename__ = "mission_memory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(100), nullable=False)
    event_type = Column(String(100), nullable=False)
    key_outcomes = Column(JSON, nullable=False, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

class FaultInjection(Base):
    __tablename__ = "fault_injection"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fault_type = Column(String(100), nullable=False)
    subsystem = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=False, default=dict)
    active = Column(Boolean, default=True, nullable=False)
    injected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    cleared_at = Column(DateTime, nullable=True)
