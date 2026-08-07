-- ================================================================================
-- SUPABASE MISSION CONTROL SEED DATA (seed.sql)
-- Pre-populates baseline users, procedures, constraints, and initial telemetry data
-- ================================================================================

-- 1. Initial Users
INSERT INTO users (id, email, full_name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'flight.director@smoa.space', 'Dr. Sarah Vance', 'flight_director'),
    ('22222222-2222-2222-2222-222222222222', 'lead.operator@smoa.space', 'Alex Chen', 'operator'),
    ('33333333-3333-3333-3333-333333333333', 'sys.admin@smoa.space', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Mission Constraints
INSERT INTO mission_constraints (parameter_name, min_value, max_value, unit, description, is_critical) VALUES
    ('Battery_SOC', 30.0, 100.0, '%', 'Minimum allowable battery state of charge', TRUE),
    ('CPU_Temperature', -20.0, 70.0, 'deg C', 'Maximum operational flight computer CPU temperature', TRUE),
    ('Fuel_Level', 10.0, 100.0, '%', 'Minimum thruster propellant fuel reserve', TRUE),
    ('CPU_Usage', 0.0, 90.0, '%', 'Maximum processor utilization threshold', TRUE),
    ('Storage_Usage', 0.0, 95.0, '%', 'Maximum onboard solid state storage utilization', TRUE)
ON CONFLICT (parameter_name) DO NOTHING;

-- 3. Mission Plan
INSERT INTO mission_plan (id, mission_name, phase, status, target_orbit) VALUES
    ('44444444-4444-4444-4444-444444444444', 'SMOA-Helios-1', 'MAPPING_OBSERVATION', 'ACTIVE', 'LEO Sun-Synchronous 520km')
ON CONFLICT (id) DO NOTHING;

-- 4. Standard Procedures
INSERT INTO procedures (id, code, title, category, steps, safety_precautions) VALUES
    ('55555555-5555-5555-5555-555555555555', 'SOP-BAT-01', 'Enter Safe Mode - Shed Non-Essential Loads', 'Power', 
     '["Deactivate payload instruments", "Switch high-gain antenna to standby", "Orient solar arrays to maximum sun exposure", "Verify battery charge recovery rate"]'::jsonb,
     '["Do not attempt orbit maneuvers while in power safe mode", "Maintain critical telemetry downlink"]'::jsonb),
    ('66666666-6666-6666-6666-666666666666', 'SOP-THR-02', 'Isolate Thruster Fuel Valve & Abort Orbit Burn', 'Propulsion',
     '["Send thruster valve close command", "Purge fuel feed lines", "Engage magnetorquers for attitude stabilization", "Report burn abort status to Ground Station"]'::jsonb,
     '["Ensure fuel pressure remains below 200 PSI during isolation"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Baseline Telemetry Record
INSERT INTO telemetry_data (
    id, timestamp,
    "Battery_Voltage", "Battery_Current", "Battery_SOC", "Battery_Temperature", "Solar_Voltage", "Solar_Current", "Power_Load", "Power_Generation",
    "Payload_Temperature", "CPU_Temperature", "Solar_Panel_Temperature", "System_Temp", "External_Temp",
    "Signal_Strength", "Downlink_Rate", "Uplink_Rate", "Packet_Loss", "Latency", "Communication_Window",
    "Roll", "Pitch", "Yaw", "Angular_Velocity", "Reaction_Wheel_Speed", "Gyroscope_X", "Gyroscope_Y", "Gyroscope_Z", "Magnetometer", "Star_Tracker_Status",
    "Altitude", "Velocity", "Latitude", "Longitude", "Orbital_Phase", "Eclipse_Status",
    "Fuel_Level", "Thruster_Temperature", "Thruster_Status", "Fuel_Pressure", "Burn_Duration",
    "Camera_Status", "Instrument_Temperature", "Instrument_Power", "Data_Collection_Rate", "Payload_Mode",
    "CPU_Usage", "RAM_Usage", "Storage_Usage", "Process_Health", "Software_Version",
    "Mission_Phase", "Observation_Window"
) VALUES (
    '77777777-7777-7777-7777-777777777777', NOW(),
    28.2, 4.8, 88.5, 24.1, 36.4, 12.5, 245.0, 410.0,
    29.5, 43.2, 12.0, 27.8, -52.0,
    -78.5, 24.8, 2.1, 0.1, 115.0, 1,
    0.2, -0.1, 0.05, 0.04, 2480.0, 0.0009, 0.0011, 0.0008, 44.8, 1,
    521.4, 7.62, 12.4, -45.2, 120.0, 0,
    85.0, 39.5, 0, 152.0, 0.0,
    1, 21.8, 84.0, 10.2, 2,
    34.2, 39.8, 54.1, 1, 2.1,
    2, 1
) ON CONFLICT (id) DO NOTHING;
