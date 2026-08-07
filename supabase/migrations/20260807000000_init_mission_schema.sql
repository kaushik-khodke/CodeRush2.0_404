-- ================================================================================
-- SUPABASE MISSION CONTROL DATABASE SCHEMA (PostgreSQL)
-- Schema Migration: 20260807000000_init_mission_schema.sql
-- Conforms 100% to Spacecraft Telemetry Specs, ML execution standards & Supabase Realtime
-- ================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- --------------------------------------------------------------------------------
CREATE TYPE user_role_enum AS ENUM ('operator', 'flight_director', 'admin');
CREATE TYPE approval_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE anomaly_severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE mission_phase_enum AS ENUM ('ORBIT_INSERTION', 'MAPPING_OBSERVATION', 'DECOMMISSIONING', 'SAFE_MODE');

-- --------------------------------------------------------------------------------
-- 2. USERS TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 3. MISSION CONSTRAINTS TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mission_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter_name VARCHAR(100) UNIQUE NOT NULL,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    unit VARCHAR(20),
    description TEXT,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 4. MISSION PLAN TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mission_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_name VARCHAR(255) NOT NULL,
    phase mission_phase_enum NOT NULL DEFAULT 'ORBIT_INSERTION',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    target_orbit VARCHAR(100) NOT NULL DEFAULT 'LEO 520km',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 5. TELEMETRY DATA TABLE (Exact 52 ML Telemetry Input Parameters)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Power Subsystem (8)
    "Battery_Voltage" DOUBLE PRECISION NOT NULL,
    "Battery_Current" DOUBLE PRECISION NOT NULL,
    "Battery_SOC" DOUBLE PRECISION NOT NULL CHECK ("Battery_SOC" >= 0.0 AND "Battery_SOC" <= 100.0),
    "Battery_Temperature" DOUBLE PRECISION NOT NULL,
    "Solar_Voltage" DOUBLE PRECISION NOT NULL,
    "Solar_Current" DOUBLE PRECISION NOT NULL,
    "Power_Load" DOUBLE PRECISION NOT NULL,
    "Power_Generation" DOUBLE PRECISION NOT NULL,
    
    -- Thermal Subsystem (5)
    "Payload_Temperature" DOUBLE PRECISION NOT NULL,
    "CPU_Temperature" DOUBLE PRECISION NOT NULL,
    "Solar_Panel_Temperature" DOUBLE PRECISION NOT NULL,
    "System_Temp" DOUBLE PRECISION NOT NULL,
    "External_Temp" DOUBLE PRECISION NOT NULL,
    
    -- Communication Subsystem (6)
    "Signal_Strength" DOUBLE PRECISION NOT NULL,
    "Downlink_Rate" DOUBLE PRECISION NOT NULL,
    "Uplink_Rate" DOUBLE PRECISION NOT NULL,
    "Packet_Loss" DOUBLE PRECISION NOT NULL CHECK ("Packet_Loss" >= 0.0 AND "Packet_Loss" <= 100.0),
    "Latency" DOUBLE PRECISION NOT NULL,
    "Communication_Window" INTEGER NOT NULL CHECK ("Communication_Window" IN (0, 1)),
    
    -- ADCS & Navigation Subsystem (10)
    "Roll" DOUBLE PRECISION NOT NULL,
    "Pitch" DOUBLE PRECISION NOT NULL,
    "Yaw" DOUBLE PRECISION NOT NULL,
    "Angular_Velocity" DOUBLE PRECISION NOT NULL,
    "Reaction_Wheel_Speed" DOUBLE PRECISION NOT NULL,
    "Gyroscope_X" DOUBLE PRECISION NOT NULL,
    "Gyroscope_Y" DOUBLE PRECISION NOT NULL,
    "Gyroscope_Z" DOUBLE PRECISION NOT NULL,
    "Magnetometer" DOUBLE PRECISION NOT NULL,
    "Star_Tracker_Status" INTEGER NOT NULL CHECK ("Star_Tracker_Status" IN (0, 1)),
    
    -- Orbit Parameters (6)
    "Altitude" DOUBLE PRECISION NOT NULL,
    "Velocity" DOUBLE PRECISION NOT NULL,
    "Latitude" DOUBLE PRECISION NOT NULL,
    "Longitude" DOUBLE PRECISION NOT NULL,
    "Orbital_Phase" DOUBLE PRECISION NOT NULL,
    "Eclipse_Status" INTEGER NOT NULL CHECK ("Eclipse_Status" IN (0, 1)),
    
    -- Propulsion Subsystem (5)
    "Fuel_Level" DOUBLE PRECISION NOT NULL CHECK ("Fuel_Level" >= 0.0 AND "Fuel_Level" <= 100.0),
    "Thruster_Temperature" DOUBLE PRECISION NOT NULL,
    "Thruster_Status" INTEGER NOT NULL CHECK ("Thruster_Status" IN (0, 1)),
    "Fuel_Pressure" DOUBLE PRECISION NOT NULL,
    "Burn_Duration" DOUBLE PRECISION NOT NULL,
    
    -- Payload Subsystem (5)
    "Camera_Status" INTEGER NOT NULL CHECK ("Camera_Status" IN (0, 1)),
    "Instrument_Temperature" DOUBLE PRECISION NOT NULL,
    "Instrument_Power" DOUBLE PRECISION NOT NULL,
    "Data_Collection_Rate" DOUBLE PRECISION NOT NULL,
    "Payload_Mode" INTEGER NOT NULL CHECK ("Payload_Mode" IN (1, 2, 3)),
    
    -- Computer Health Subsystem (5)
    "CPU_Usage" DOUBLE PRECISION NOT NULL CHECK ("CPU_Usage" >= 0.0 AND "CPU_Usage" <= 100.0),
    "RAM_Usage" DOUBLE PRECISION NOT NULL CHECK ("RAM_Usage" >= 0.0 AND "RAM_Usage" <= 100.0),
    "Storage_Usage" DOUBLE PRECISION NOT NULL CHECK ("Storage_Usage" >= 0.0 AND "Storage_Usage" <= 100.0),
    "Process_Health" INTEGER NOT NULL CHECK ("Process_Health" IN (0, 1)),
    "Software_Version" DOUBLE PRECISION NOT NULL,
    
    -- Mission Parameters (2)
    "Mission_Phase" INTEGER NOT NULL CHECK ("Mission_Phase" IN (1, 2, 3)),
    "Observation_Window" INTEGER NOT NULL CHECK ("Observation_Window" IN (0, 1)),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 6. PREDICTIONS TABLE (ML Output Targets & XAI Cards)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID NOT NULL REFERENCES telemetry_data(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failure_class VARCHAR(100) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    anomaly_score DOUBLE PRECISION NOT NULL,
    remaining_battery_life DOUBLE PRECISION NOT NULL,
    temperature_after_30min DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    constraint_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_procedure TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 7. ANOMALIES TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID NOT NULL REFERENCES telemetry_data(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_type VARCHAR(100) NOT NULL,
    severity anomaly_severity_enum NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 8. PROCEDURES TABLE (Standard Emergency & Operating Procedures)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    safety_precautions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 9. APPROVAL QUEUE TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID NOT NULL REFERENCES telemetry_data(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
    recommended_action TEXT NOT NULL,
    status approval_status_enum NOT NULL DEFAULT 'PENDING',
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 10. AUDIT LOG TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 11. MISSION MEMORY TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mission_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    key_outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 12. FAULT INJECTION TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fault_injection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fault_type VARCHAR(100) NOT NULL,
    subsystem VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    injected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cleared_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------------------
-- 13. INDEXES FOR HIGH-THROUGHPUT PERFORMANCE
-- --------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_telemetry_id ON predictions(telemetry_id);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- --------------------------------------------------------------------------------
-- 14. SUPABASE REALTIME CONFIGURATION
-- Enable realtime events for telemetry streaming, predictions & approval queue
-- --------------------------------------------------------------------------------
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE telemetry_data, predictions, approval_queue, audit_log, anomalies;
COMMIT;
