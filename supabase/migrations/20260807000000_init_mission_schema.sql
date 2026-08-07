-- ================================================================================
-- SUPABASE MISSION CONTROL DATABASE SCHEMA (PostgreSQL)
-- Schema Migration: 20260807000000_init_mission_schema.sql
-- Conforms 100% to Spacecraft Telemetry Specs, ML execution standards & Supabase Realtime
-- ================================================================================

-- Enable UUID & PGCrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- --------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('operator', 'flight_director', 'admin', 'system_agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE anomaly_severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE mission_phase_enum AS ENUM ('LAUNCH', 'ORBIT_INSERTION', 'MAPPING_OBSERVATION', 'MAINTENANCE', 'SAFE_MODE', 'DECOMMISSIONING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE activity_type_enum AS ENUM ('OBSERVATION', 'DOWNLINK', 'MAINTENANCE', 'CALIBRATION', 'SAFE_MODE_TRANSITION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE activity_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ABORTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------------------------------
-- 2. USERS TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 3. MISSION PLAN & ACTIVITY SCHEDULES
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mission_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_name VARCHAR(255) NOT NULL,
    phase mission_phase_enum NOT NULL DEFAULT 'ORBIT_INSERTION',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    target_orbit VARCHAR(100) NOT NULL DEFAULT 'LEO 520km Sun-Synchronous',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES mission_plan(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    activity_type activity_type_enum NOT NULL,
    status activity_status_enum NOT NULL DEFAULT 'SCHEDULED',
    priority INTEGER NOT NULL DEFAULT 1,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    resource_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    precedence_constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
    selection_rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 4. COMMUNICATION WINDOWS & GROUND STATIONS
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS communication_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ground_station_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_elevation DOUBLE PRECISION,
    available_bandwidth_mbps DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 5. MISSION CONSTRAINTS TABLE
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
-- 6. TELEMETRY DATA TABLE (Exact 52 Spacecraft Telemetry Parameters)
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
-- 7. PREDICTIONS TABLE (ML Diagnosis & Predictive Intelligence)
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
-- 8. ANOMALIES & DIAGNOSTIC HYPOTHESES
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID NOT NULL REFERENCES telemetry_data(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_type VARCHAR(100) NOT NULL,
    severity anomaly_severity_enum NOT NULL DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    competing_hypotheses JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_procedure TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 9. PROCEDURES TABLE (Versioned SOP Runbooks)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    preconditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    safety_precautions JSONB NOT NULL DEFAULT '[]'::jsonb,
    simulated_effects JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 10. APPROVAL QUEUE TABLE (Operator Authority Gating)
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telemetry_id UUID REFERENCES telemetry_data(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
    procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
    recommended_action TEXT NOT NULL,
    command_preview JSONB NOT NULL DEFAULT '{}'::jsonb,
    safety_check_passed BOOLEAN NOT NULL DEFAULT TRUE,
    status approval_status_enum NOT NULL DEFAULT 'PENDING',
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    execution_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 11. FAULT INJECTION TABLE
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
-- 12. MISSION MEMORY TABLE
-- --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mission_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    key_outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,
    authority_boundary VARCHAR(100) NOT NULL DEFAULT 'OPERATOR_ONLY',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 13. AUDIT LOG & REPLAY STORE
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

CREATE TABLE IF NOT EXISTS simulation_replays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    telemetry_snapshot_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    automated_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    operator_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
    simulated_outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------------
-- 14. HIGH-PERFORMANCE INDEXES
-- --------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_telemetry_id ON predictions(telemetry_id);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_start ON activity_schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_communication_windows_start ON communication_windows(start_time);

-- --------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and grant access for public/anon & authenticated Supabase clients
-- --------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_injection ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_replays ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for seamless API & backend client interaction
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public all telemetry" ON telemetry_data FOR ALL USING (true);
CREATE POLICY "Allow public all predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow public all anomalies" ON anomalies FOR ALL USING (true);
CREATE POLICY "Allow public all procedures" ON procedures FOR ALL USING (true);
CREATE POLICY "Allow public all approval_queue" ON approval_queue FOR ALL USING (true);
CREATE POLICY "Allow public all mission_plan" ON mission_plan FOR ALL USING (true);
CREATE POLICY "Allow public all activity_schedules" ON activity_schedules FOR ALL USING (true);
CREATE POLICY "Allow public all communication_windows" ON communication_windows FOR ALL USING (true);
CREATE POLICY "Allow public all mission_constraints" ON mission_constraints FOR ALL USING (true);
CREATE POLICY "Allow public all fault_injection" ON fault_injection FOR ALL USING (true);
CREATE POLICY "Allow public all mission_memory" ON mission_memory FOR ALL USING (true);
CREATE POLICY "Allow public all audit_log" ON audit_log FOR ALL USING (true);
CREATE POLICY "Allow public all simulation_replays" ON simulation_replays FOR ALL USING (true);

-- --------------------------------------------------------------------------------
-- 16. SUPABASE REALTIME PUBLICATION
-- Enable Realtime for live updates on telemetry, predictions, approvals, and anomalies
-- --------------------------------------------------------------------------------
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    telemetry_data, 
    predictions, 
    approval_queue, 
    anomalies, 
    audit_log, 
    activity_schedules, 
    fault_injection;
COMMIT;
