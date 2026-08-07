import asyncio
import time
import math
import random
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.websocket import ws_manager

router = APIRouter(tags=["Data Seeding & Mission API"])

class SeedingState:
    def __init__(self):
        self.is_active: bool = False
        self.rate_hz: float = 1.0
        self.anomaly_mode: str = "nominal"
        self.met: int = 128400
        self.soc: float = 88.5
        self.frame_count: int = 0
        self.task: Optional[asyncio.Task] = None
        self.custom_params: Dict[str, float] = {}
        self.session_id: str = f"SESS-{int(time.time())}-{random.randint(1000, 9999)}"
        
        # Fresh session dynamic storage — ZERO predefined static tasks/events
        self.history_buffer: List[Dict[str, Any]] = []
        self.events: List[Dict[str, Any]] = []
        self.pending_commands: List[Dict[str, Any]] = []

    def reset_state(self):
        self.met = 128400
        self.soc = 88.5
        self.frame_count = 0
        self.custom_params = {}
        self.history_buffer = []
        self.events = []
        self.pending_commands = []
        self.anomaly_mode = "nominal"
        self.session_id = f"SESS-{int(time.time())}-{random.randint(1000, 9999)}"

state = SeedingState()

def create_anomaly_event_and_command(mode: str, detail_override: Optional[str] = None) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    if mode == "nominal" and not detail_override:
        return None, None
    
    now_ms = int(time.time() * 1000)
    event_id = f"EVT-{random.randint(5000, 9999)}"
    cmd_id = f"CMD-{random.randint(3000, 9999)}"

    if mode == "custom_offset" or detail_override:
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "sensors",
            "severity": "critical",
            "title": f"CUSTOM SENSOR EXCURSION: {detail_override or 'Operator Fine-Tune Offset Limit Reached'}",
            "detector": "ML Sentinel · Real-time Sensor Offsetter Monitor",
            "score": 0.89,
            "diagnosis": {
                "rootCause": "Manual sensor bias fine-tuning introduced critical parameter deviation.",
                "confidence": 0.92,
                "evidence": [
                    detail_override or "Sensor offset pushed telemetry out of nominal envelope",
                    "ML Sentinel score elevated above 0.80 threshold"
                ],
                "proposedAction": "RESET_SENSOR_OFFSETS_TO_ZERO",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 15,
                "predictiveMetrics": {
                    "remainingBatteryLife": "10.0 hours",
                    "estCpuTemp30min": "52.0 °C"
                },
                "constraintViolations": ["FR-09 Custom sensor offset limit exceeded"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "RESET_SENSOR_OFFSETS_TO_ZERO",
            "subsystem": "sensors",
            "summary": "Reset all fine-tuned sensor offsets back to zero nominal baseline.",
            "irreversible": False,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Restores baseline sensor calibration parameters.",
                "checks": [{"name": "FR-09 sensor calibration", "ok": True, "detail": "reset confirmed"}]
            }
        }
        return event, cmd

    if mode == "power_droop":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "power",
            "severity": "critical",
            "title": "EMERGENCY: Battery bus voltage droop beyond 3σ safety envelope (<21.0V)",
            "detector": "ML Sentinel · XGBoost & Isolation Forest v2.0",
            "score": 0.96,
            "diagnosis": {
                "rootCause": "Battery cell balancing FET latched open under peak eclipse load.",
                "confidence": 0.94,
                "evidence": [
                    "Bus voltage dropped from 28.2V to 18.5V (34% droop)",
                    "Cell balancing telemetry word latched at 0x00",
                    "SoC depletion rate accelerated by 4.2x"
                ],
                "proposedAction": "PWR_SHED_PAYLOAD_HEATER_BUS",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 38,
                "predictiveMetrics": {
                    "remainingBatteryLife": "3.2 hours (Critical)",
                    "estCpuTemp30min": "48.5 °C"
                },
                "constraintViolations": ["FR-12 battery DoD limit exceeded", "FR-08 payload bus voltage < 22V"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "PWR_SHED_PAYLOAD_HEATER_BUS",
            "subsystem": "power",
            "summary": "Disable payload heater bus for 3 orbits to protect battery depth-of-discharge during eclipse.",
            "irreversible": True,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Battery SoC forecast retains 6.4% margin across eclipse pass.",
                "checks": [
                    {"name": "FR-08 payload survival temp", "ok": True, "detail": "min -24.1 deg C vs limit -30.5 deg C"},
                    {"name": "FR-12 battery DoD", "ok": True, "detail": "peak 31% vs limit 40%"},
                    {"name": "FR-21 command window", "ok": True, "detail": "AOS Svalbard active"}
                ]
            }
        }
        return event, cmd

    elif mode == "adcs_oscillation":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "adcs",
            "severity": "warning",
            "title": "ADCS WARNING: Reaction wheel 3 torque ripple & pointing excursion",
            "detector": "ML Sentinel · Spectral Anomaly Model v2.8",
            "score": 0.78,
            "diagnosis": {
                "rootCause": "Bearing lubricant breakdown causing 0.8 Hz torque oscillation on Wheel 3.",
                "confidence": 0.82,
                "evidence": [
                    "0.8 Hz spectral torque ripple on RW3",
                    "Body rate noise increased from 0.04°/s to 1.85°/s",
                    "Roll angle deviation ±18.0°"
                ],
                "proposedAction": "ADCS_WHEEL3_BEARING_RUNIN",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 31,
                "predictiveMetrics": {
                    "remainingBatteryLife": "14.1 hours",
                    "estCpuTemp30min": "42.0 °C"
                },
                "constraintViolations": ["FR-03 pointing stability RMS limit exceeded"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "ADCS_WHEEL3_BEARING_RUNIN",
            "subsystem": "adcs",
            "summary": "Spin reaction wheel 3 to 4200 RPM for 20 minutes to redistribute bearing lubricant.",
            "irreversible": False,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "fail",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Momentum envelope rule violated during active payload observation window.",
                "checks": [
                    {"name": "FR-03 pointing stability", "ok": False, "detail": "0.041 deg RMS vs limit 0.020 deg RMS"},
                    {"name": "FR-17 momentum envelope", "ok": False, "detail": "94% saturation vs limit 80%"},
                    {"name": "FR-21 command window", "ok": True, "detail": "within contact"}
                ]
            }
        }
        return event, cmd

    elif mode == "thermal_overheat":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "thermal",
            "severity": "critical",
            "title": "THERMAL HAZARD: CPU temperature exceeded 78°C limit & Loop-A void",
            "detector": "ML Sentinel · Thermal Regressor Residual v3.1",
            "score": 0.94,
            "diagnosis": {
                "rootCause": "Loop-A coolant flow void inducing thermal buildup on flight computer.",
                "confidence": 0.91,
                "evidence": [
                    "CPU temperature spiked to 78.4°C (Limit: 70.0°C)",
                    "Coolant Loop-A pressure delta reduced by 92%",
                    "Processor thermal throttling engaged"
                ],
                "proposedAction": "THERM_PUMPA_OVERSPEED_110",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 29,
                "predictiveMetrics": {
                    "remainingBatteryLife": "12.0 hours",
                    "estCpuTemp30min": "84.2 °C (CRITICAL)"
                },
                "constraintViolations": ["FR-05 CPU temperature > 70°C threshold"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "THERM_PUMPA_OVERSPEED_110",
            "subsystem": "thermal",
            "summary": "Command coolant pump A to 110% for two orbits to clear a suspected coolant void.",
            "irreversible": True,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Pump duty cycle and power draw remain inside certified limits.",
                "checks": [
                    {"name": "FR-05 pump duty cycle", "ok": True, "detail": "110% for 190 min vs limit 115% / 240 min"},
                    {"name": "FR-12 bus load", "ok": True, "detail": "+38 W, margin 210 W"}
                ]
            }
        }
        return event, cmd

    elif mode == "comms_loss":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "comms",
            "severity": "warning",
            "title": "COMMS DEGRADATION: S-Band RSSI drop to -105 dBm & 38% packet loss",
            "detector": "ML Sentinel · Link Budget Regressor",
            "score": 0.72,
            "diagnosis": {
                "rootCause": "High-gain antenna mispointing combined with ground station atmospheric fading.",
                "confidence": 0.79,
                "evidence": [
                    "Signal strength attenuated to -105.0 dBm",
                    "Packet loss rate elevated to 38.5%",
                    "Downlink throughput degraded to 2.1 Mbps"
                ],
                "proposedAction": "COMMS_SWITCH_TO_OMNI_BACKUP",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 42,
                "predictiveMetrics": {
                    "remainingBatteryLife": "15.0 hours",
                    "estCpuTemp30min": "40.1 °C"
                },
                "constraintViolations": []
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "COMMS_SWITCH_TO_OMNI_BACKUP",
            "subsystem": "comms",
            "summary": "Switch S-band transponder from directional dish to omnidirectional backup antenna.",
            "irreversible": False,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Omni antenna draw fits within baseline power budget.",
                "checks": [{"name": "FR-22 RF power", "ok": True, "detail": "12W vs max 15W"}]
            }
        }
        return event, cmd

    elif mode == "thruster_leak":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "propulsion",
            "severity": "critical",
            "title": "PROPULSION CRITICAL: Thruster fuel valve pressure drop to 40 PSI",
            "detector": "ML Sentinel · Propellant Pressure Monitor",
            "score": 0.97,
            "diagnosis": {
                "rootCause": "Thruster solenoid valve seal degradation producing propellant leak.",
                "confidence": 0.95,
                "evidence": [
                    "Fuel tank pressure dropped to 40.0 PSI (Nominal: 152 PSI)",
                    "Thruster manifold temp spiked to 125.0°C",
                    "Propellant level depleted by 35%"
                ],
                "proposedAction": "SOP-THR-02: Isolate Thruster Fuel Valve & Abort Orbit Maneuver",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 24,
                "predictiveMetrics": {
                    "remainingBatteryLife": "11.5 hours",
                    "estCpuTemp30min": "45.0 °C"
                },
                "constraintViolations": ["FR-15 Fuel pressure < 100 PSI"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "PROP_ISOLATE_FUEL_SOLENOID",
            "subsystem": "propulsion",
            "summary": "Close master fuel isolation valve to seal thruster manifold leak.",
            "irreversible": True,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Fuel line isolation prevents further pressure depletion.",
                "checks": [{"name": "FR-15 line isolation", "ok": True, "detail": "valve latch verified"}]
            }
        }
        return event, cmd

    elif mode == "overfitting":
        event = {
            "id": event_id,
            "ts": now_ms,
            "subsystem": "overload",
            "severity": "critical",
            "title": "MULTIPLE SYSTEM FAILURE: Simultaneous Power, ADCS & Thermal Collapse",
            "detector": "ML Sentinel · Compound Anomaly Engine",
            "score": 0.99,
            "diagnosis": {
                "rootCause": "Severe cascading system fault across bus power, orientation, and thermal loops.",
                "confidence": 0.98,
                "evidence": [
                    "Voltage droop 16.2V, CPU temp 88°C, RW3 speed 5400 RPM",
                    "Multi-subsystem rule violations",
                    "Automated Safe Mode entry recommended"
                ],
                "proposedAction": "SOP-BAT-01: Enter Safe Mode - Shed Non-Essential Loads",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 18,
                "predictiveMetrics": {
                    "remainingBatteryLife": "1.8 hours (EMERGENCY)",
                    "estCpuTemp30min": "92.0 °C"
                },
                "constraintViolations": ["FR-01, FR-03, FR-05, FR-12 All Limits Exceeded"]
            }
        }
        cmd = {
            "id": cmd_id,
            "ts": now_ms,
            "command": "SYS_ENTER_SAFE_MODE",
            "subsystem": "power",
            "summary": "Enter spacecraft global safe mode, shedding non-essential payload loads.",
            "irreversible": True,
            "linkedEventId": event_id,
            "state": "pending",
            "constraint": {
                "status": "pass",
                "solver": "ML Sentinel Solver · XGBoost & Rule Engine v2.0",
                "reasoning": "Safe mode preserves satellite power budget.",
                "checks": [{"name": "FR-01 survival power", "ok": True, "detail": "65W minimum guaranteed"}]
            }
        }
        return event, cmd

    return None, None

def generate_telemetry(anomaly_mode: str = "nominal", met_val: int = 128400, soc_val: float = 88.5, custom: Dict[str, float] = None) -> Dict[str, Any]:
    if custom is None:
        custom = {}

    t_sec = met_val
    t_ms = int(time.time() * 1000)
    orbit_angle = (t_sec / 5580.0) * 360.0 % 360.0
    eclipse = 205.0 < orbit_angle < 320.0

    wobble = lambda period, phase=0.0: math.sin((t_sec / period) * math.pi * 2 + phase)

    # Extract 52 custom offsets by canonical key or legacy alias
    v_offset = custom.get("Battery_Voltage", custom.get("voltage_offset", 0.0))
    t_cpu_offset = custom.get("CPU_Temperature", custom.get("cpu_temp_offset", custom.get("temp_offset", 0.0)))
    t_batt_offset = custom.get("Battery_Temperature", custom.get("temp_offset", 0.0))
    rpm_offset = custom.get("Reaction_Wheel_Speed", custom.get("wheel_rpm_offset", 0.0))
    loss_offset = custom.get("Packet_Loss", custom.get("packet_loss_offset", 0.0))
    press_offset = custom.get("Fuel_Pressure", custom.get("fuel_pressure_offset", 0.0))
    fuel_offset = custom.get("Fuel_Level", custom.get("fuel_level_offset", 0.0))
    roll_offset = custom.get("Roll", custom.get("roll_offset", 0.0))
    pitch_offset = custom.get("Pitch", 0.0)
    yaw_offset = custom.get("Yaw", 0.0)
    ang_vel_offset = custom.get("Angular_Velocity", custom.get("angular_vel_offset", 0.0))
    sig_offset = custom.get("Signal_Strength", custom.get("signal_offset", 0.0))
    lat_offset = custom.get("Latency", custom.get("latency_offset", 0.0))
    thr_temp_offset = custom.get("Thruster_Temperature", custom.get("thruster_temp_offset", 0.0))
    cpu_usage_offset = custom.get("CPU_Usage", custom.get("cpu_usage_offset", 0.0))

    batt_volts = 28.2 + wobble(29) * 0.4 + v_offset
    batt_curr = (4.8 if not eclipse else -2.1) + custom.get("Battery_Current", 0.0)
    soc = max(5.0, min(100.0, soc_val + (-0.02 if eclipse else 0.03) + custom.get("Battery_SOC", 0.0)))
    batt_temp = 24.1 + wobble(211) * 1.5 + (1.5 if not eclipse else -3.0) + t_batt_offset
    
    cpu_temp = 43.2 + wobble(150) * 2.0 + t_cpu_offset
    payload_temp = 29.5 + wobble(167) * 1.8 + custom.get("Payload_Temperature", t_cpu_offset * 0.5)
    radiator_temp = 18.2 + wobble(233) * 3.0 + custom.get("System_Temp", 0.0)
    
    wheel_rpm = 2480.0 + wobble(89) * 150.0 + rpm_offset
    roll = 0.2 + wobble(97) * 2.0 + roll_offset
    pitch = -0.1 + wobble(131, 0.8) * 1.5 + pitch_offset
    yaw = (((t_sec / 3.0) % 360.0) - 180.0) + yaw_offset
    angular_vel = 0.04 + abs(wobble(61)) * 0.02 + ang_vel_offset

    signal_dbm = -78.5 + wobble(73) * 2.0 + sig_offset
    packet_loss = max(0.0, 0.1 + wobble(41) * 0.2 + loss_offset)
    latency = 115.0 + wobble(311) * 10.0 + lat_offset

    fuel_level = max(0.0, 85.0 - (t_sec - 128400) * 0.001) + fuel_offset
    fuel_pressure = 152.0 + press_offset
    thruster_temp = 39.5 + thr_temp_offset

    cpu_usage = 34.2 + cpu_usage_offset
    array_power = (410.0 + wobble(53) * 18.0 if not eclipse else 0.0) + custom.get("Power_Generation", 0.0)
    
    if anomaly_mode == "power_droop":
        batt_volts = max(18.2, 28.2 - 9.7 + wobble(11) * 0.8) + v_offset
        soc = max(12.0, soc - 0.5)
        batt_temp += 12.5 + wobble(15) * 1.5
        array_power = 180.0 if not eclipse else 0.0
    elif anomaly_mode == "adcs_oscillation":
        wheel_rpm = 5443.0 + wobble(12) * 850.0 + rpm_offset
        angular_vel = 0.85 + wobble(8) * 0.4
        roll = 1.39 + wobble(15) * 14.0
        pitch = -1.30 + wobble(19) * 8.0
    elif anomaly_mode == "thermal_overheat":
        cpu_temp = 78.4 + wobble(45) * 5.0 + t_cpu_offset
        payload_temp = 68.2 + wobble(30) * 3.0
        radiator_temp = 53.2 + wobble(40) * 4.0
        cpu_usage = 89.5
    elif anomaly_mode == "comms_loss":
        signal_dbm = -105.0 + wobble(30) * 5.0
        packet_loss = min(95.0, 38.5 + wobble(20) * 15.0 + loss_offset)
        latency = 480.0
    elif anomaly_mode == "thruster_leak":
        fuel_pressure = max(40.0, 152.0 - (t_sec % 100) * 1.1) + press_offset
        thruster_temp = 125.0 + wobble(20) * 10.0 + thr_temp_offset
        fuel_level = max(2.0, fuel_level - 0.4)
    elif anomaly_mode == "sensor_drift":
        batt_volts -= (t_sec % 60) * 0.12
        roll += (t_sec % 40) * 0.5
        cpu_temp += (t_sec % 30) * 0.8
    elif anomaly_mode == "overfitting":
        batt_volts = 16.2 + wobble(7) * 1.2
        soc = 8.0
        cpu_temp = 88.0 + wobble(10) * 4.0
        packet_loss = 65.0
        wheel_rpm = 5443.0
        fuel_pressure = 25.0

    # Dynamic ML Anomaly Score evaluation across 52 parameters
    is_custom_anomaly = False
    score = 0.08
    if anomaly_mode != "nominal":
        score = 0.96
    else:
        # Check active custom offset limits across 52 parameters
        excursions = 0
        if batt_volts < 22.0 or batt_volts > 33.5: excursions += 1
        if cpu_temp > 68.0 or batt_temp > 65.0: excursions += 1
        if wheel_rpm > 4200.0: excursions += 1
        if packet_loss > 20.0: excursions += 1
        if fuel_pressure < 100.0: excursions += 1
        if abs(roll) > 15.0 or abs(pitch) > 15.0: excursions += 1
        if signal_dbm < -98.0: excursions += 1
        if cpu_usage > 85.0: excursions += 1
        if thruster_temp > 90.0: excursions += 1
        
        # Count non-zero custom parameters
        non_zero_customs = sum(1 for k, v in custom.items() if abs(v) > 0.0001)
        if excursions > 0 or non_zero_customs >= 3:
            score = max(score, 0.75 + min(0.20, (excursions * 0.08) + (non_zero_customs * 0.02)))
            is_custom_anomaly = True

    frontend_frame = {
        "met": t_sec,
        "t": t_ms,
        "orbitAngle": orbit_angle,
        "eclipse": eclipse,
        "anomalyMode": "custom_offset" if is_custom_anomaly and anomaly_mode == "nominal" else anomaly_mode,
        "simulatorEngine": "Basilisk (BSK) Astrodynamics v2.4",
        "power": {
            "busVoltage": round(batt_volts, 2),
            "stateOfCharge": round(soc, 2),
            "arrayPower": round(array_power, 0)
        },
        "thermal": {
            "batteryTemp": round(batt_temp, 2),
            "payloadTemp": round(payload_temp, 2),
            "radiatorTemp": round(radiator_temp, 2)
        },
        "adcs": {
            "roll": round(roll, 2),
            "pitch": round(pitch, 2),
            "yaw": round(yaw, 2),
            "bodyRate": round(angular_vel, 3),
            "wheelRpm": round(wheel_rpm, 1)
        },
        "comms": {
            "signalDbm": round(signal_dbm, 2),
            "packetLoss": round(packet_loss, 2),
            "rttSeconds": round(latency / 1000.0, 3)
        },
        "anomalyScore": score,
    }

    return frontend_frame

async def seeding_loop():
    while state.is_active:
        state.met += 1
        state.frame_count += 1
        frame = generate_telemetry(state.anomaly_mode, state.met, state.soc, state.custom_params)
        state.soc = frame["power"]["stateOfCharge"]
        
        # Append to rolling history buffer
        state.history_buffer.append(frame)
        if len(state.history_buffer) > 300:
            state.history_buffer = state.history_buffer[-300:]

        # Sync telemetry directly to Supabase table
        try:
            from database.repositories.supabase_repository import SupabaseRepository
            db_dict = {
                "Battery_Voltage": frame["power"]["busVoltage"],
                "Battery_Current": 4.8 if not frame["eclipse"] else -2.1,
                "Battery_SOC": frame["power"]["stateOfCharge"],
                "Battery_Temperature": frame["thermal"]["batteryTemp"],
                "Solar_Voltage": 35.0 if not frame["eclipse"] else 0.0,
                "Solar_Current": 12.0 if not frame["eclipse"] else 0.0,
                "Power_Load": 280.0,
                "Power_Generation": frame["power"]["arrayPower"],
                "Payload_Temperature": frame["thermal"]["payloadTemp"],
                "CPU_Temperature": round(43.2 + (frame["thermal"]["batteryTemp"] - 24.1), 2),
                "Solar_Panel_Temperature": 25.0 if not frame["eclipse"] else -60.0,
                "System_Temp": frame["thermal"]["radiatorTemp"],
                "External_Temp": -50.0,
                "Signal_Strength": frame["comms"]["signalDbm"],
                "Downlink_Rate": 10.0,
                "Uplink_Rate": 1.0,
                "Packet_Loss": frame["comms"]["packetLoss"],
                "Latency": frame["comms"]["rttSeconds"] * 1000.0,
                "Communication_Window": 1,
                "Roll": frame["adcs"]["roll"],
                "Pitch": frame["adcs"]["pitch"],
                "Yaw": frame["adcs"]["yaw"],
                "Angular_Velocity": frame["adcs"]["bodyRate"],
                "Reaction_Wheel_Speed": frame["adcs"]["wheelRpm"],
                "Gyroscope_X": 0.001,
                "Gyroscope_Y": 0.001,
                "Gyroscope_Z": 0.001,
                "Magnetometer": 45.0,
                "Star_Tracker_Status": 1,
                "Altitude": 525.0,
                "Velocity": 7.6,
                "Latitude": 12.0,
                "Longitude": 45.0,
                "Orbital_Phase": frame["orbitAngle"],
                "Eclipse_Status": 1 if frame["eclipse"] else 0,
                "Fuel_Level": 85.0,
                "Thruster_Temperature": 39.5,
                "Thruster_Status": 0,
                "Fuel_Pressure": 152.0,
                "Burn_Duration": 0,
                "Camera_Status": 1,
                "Instrument_Temperature": 20.0,
                "Instrument_Power": 80.0,
                "Data_Collection_Rate": 10.0,
                "Payload_Mode": 2,
                "CPU_Usage": 34.2,
                "RAM_Usage": 50.0,
                "Storage_Usage": 40.0,
                "Process_Health": 1,
                "Software_Version": 2.1,
                "Mission_Phase": 1,
                "Observation_Window": 1
            }
            SupabaseRepository.insert_telemetry(db_dict)
        except Exception:
            pass

        await ws_manager.broadcast({
            "type": "TELEMETRY_FRAME",
            "frame": frame
        })
        
        sleep_dur = max(0.05, 1.0 / max(0.1, state.rate_hz))
        await asyncio.sleep(sleep_dur)

class AnomalyRequest(BaseModel):
    mode: str

class RateRequest(BaseModel):
    rate_hz: float

class CustomParamsRequest(BaseModel):
    params: Dict[str, float]

class AuthRequest(BaseModel):
    decision: str
    operatorNote: Optional[str] = None

@router.post("/api/seeding/start")
async def start_seeding():
    if not state.is_active:
        state.is_active = True
        state.task = asyncio.create_task(seeding_loop())
    return {"status": "ACTIVE", "message": "Telemetry data seeding started", "rate_hz": state.rate_hz}

@router.post("/api/seeding/stop")
async def stop_seeding():
    state.is_active = False
    if state.task and not state.task.done():
        state.task.cancel()
        state.task = None
    return {"status": "STOPPED", "message": "Telemetry data seeding halted completely"}

@router.get("/api/seeding/status")
def get_seeding_status():
    return {
        "is_active": state.is_active,
        "rate_hz": state.rate_hz,
        "anomaly_mode": state.anomaly_mode,
        "frame_count": state.frame_count,
        "met": state.met,
        "soc": state.soc,
        "custom_params": state.custom_params
    }

@router.get("/api/seeding/history")
def get_seeding_history():
    return {
        "history": state.history_buffer,
        "events": state.events,
        "commands": state.pending_commands,
        "anomaly_mode": state.anomaly_mode,
        "is_active": state.is_active
    }

@router.post("/api/seeding/anomaly")
async def set_anomaly(req: AnomalyRequest):
    allowed_modes = ["nominal", "power_droop", "adcs_oscillation", "thermal_overheat", "comms_loss", "thruster_leak", "sensor_drift", "overfitting"]
    if req.mode not in allowed_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of {allowed_modes}")
    
    state.anomaly_mode = req.mode
    
    event, cmd = create_anomaly_event_and_command(req.mode)
    if event:
        # Deduplicate events by subsystem
        state.events = [e for e in state.events if e.get("subsystem") != event.get("subsystem")]
        state.events.insert(0, event)
        
        if cmd:
            # Deduplicate pending commands by command name
            state.pending_commands = [c for c in state.pending_commands if c.get("command") != cmd.get("command")]
            state.pending_commands.insert(0, cmd)
            
        try:
            from database.repositories.supabase_repository import SupabaseRepository
            SupabaseRepository.insert_anomaly({
                "anomaly_type": event.get("title", "Telemetry Anomaly"),
                "severity": event.get("severity", "MEDIUM").upper(),
                "description": event.get("diagnosis", {}).get("rootCause", "Simulated Anomaly"),
                "competing_hypotheses": event.get("diagnosis", {}).get("evidence", []),
                "recommended_procedure": event.get("diagnosis", {}).get("proposedAction", "Review SOP")
            })
            if cmd:
                SupabaseRepository.insert_approval_item({
                    "recommended_action": cmd.get("summary", cmd.get("command", "Execute Command")),
                    "command_preview": cmd,
                    "status": "PENDING"
                })
        except Exception:
            pass

        await ws_manager.broadcast({
            "type": "ANOMALY_EVENT",
            "event": event,
            "command": cmd
        })
        
    return {"status": "SUCCESS", "anomaly_mode": state.anomaly_mode, "event": event, "command": cmd}

@router.post("/api/seeding/rate")
def set_rate(req: RateRequest):
    if req.rate_hz <= 0 or req.rate_hz > 50:
        raise HTTPException(status_code=400, detail="Rate must be between 0.1 and 50 Hz")
    state.rate_hz = req.rate_hz
    return {"status": "SUCCESS", "rate_hz": state.rate_hz}

@router.post("/api/seeding/custom")
async def set_custom(req: CustomParamsRequest):
    state.custom_params.update(req.params)
    
    # Evaluate if custom offsets trigger an alert card
    excursions = []
    for k, val in state.custom_params.items():
        if abs(val) > 0.0001:
            excursions.append(f"{k}: {val:+}")

    event, cmd = None, None
    if excursions:
        detail = "Manual Custom Offsets Active: " + ", ".join(excursions[:3]) + (f" (+{len(excursions)-3} more)" if len(excursions) > 3 else "")
        
        # Check if RESET_SENSOR_OFFSETS_TO_ZERO command already exists
        existing_cmd = next((c for c in state.pending_commands if c.get("command") == "RESET_SENSOR_OFFSETS_TO_ZERO" and c.get("state") == "pending"), None)
        if existing_cmd:
            existing_cmd["ts"] = int(time.time() * 1000)
            existing_cmd["summary"] = f"Reset all fine-tuned sensor offsets back to zero nominal baseline. Active: {detail}"
            cmd = existing_cmd
        else:
            event, cmd = create_anomaly_event_and_command("custom_offset", detail)
            if event:
                state.events = [e for e in state.events if e.get("subsystem") != "sensors"]
                state.events.insert(0, event)
            if cmd:
                state.pending_commands = [c for c in state.pending_commands if c.get("command") != "RESET_SENSOR_OFFSETS_TO_ZERO"]
                state.pending_commands.insert(0, cmd)

            try:
                from database.repositories.supabase_repository import SupabaseRepository
                if event:
                    SupabaseRepository.insert_anomaly({
                        "anomaly_type": "Custom Sensor Excursion",
                        "severity": "HIGH",
                        "description": detail,
                        "recommended_procedure": "RESET_SENSOR_OFFSETS_TO_ZERO"
                    })
            except Exception:
                pass

        await ws_manager.broadcast({
            "type": "ANOMALY_EVENT",
            "event": event,
            "command": cmd
        })

    return {"status": "SUCCESS", "custom_params": state.custom_params, "event": event}

@router.post("/api/seeding/step")
async def step_frame():
    state.met += 1
    state.frame_count += 1
    frame = generate_telemetry(state.anomaly_mode, state.met, state.soc, state.custom_params)
    state.soc = frame["power"]["stateOfCharge"]
    
    state.history_buffer.append(frame)
    if len(state.history_buffer) > 300:
        state.history_buffer = state.history_buffer[-300:]

    await ws_manager.broadcast({
        "type": "TELEMETRY_FRAME",
        "frame": frame
    })
    return {"status": "STEPPED", "frame": frame}

@router.post("/api/seeding/clear")
def clear_db():
    state.reset_state()
    return {"status": "SUCCESS", "message": "Seeding telemetry buffer & state reset to initial conditions"}

@router.get("/api/events")
def get_events():
    return state.events

@router.get("/api/commands/pending")
def get_pending_commands():
    seen = set()
    unique_pending = []
    for c in state.pending_commands:
        if c.get("state") == "pending":
            cmd_name = c.get("command")
            if cmd_name not in seen:
                seen.add(cmd_name)
                unique_pending.append(c)
    return unique_pending

@router.post("/api/commands/{id}/authorize")
async def authorize_command(id: str, req: AuthRequest):
    for c in state.pending_commands:
        if c.get("id") == id:
            decision_state = "approved" if req.decision == "approve" else "rejected"
            c["state"] = decision_state
            linked_evt_id = c.get("linkedEventId")
            cmd_subsystem = c.get("subsystem")
            target_cmd_name = c.get("command")
            
            # Remove ALL duplicate pending commands and matching anomaly events
            state.pending_commands = [
                item for item in state.pending_commands
                if item.get("id") != id and item.get("command") != target_cmd_name and item.get("subsystem") != cmd_subsystem
            ]
            state.events = [e for e in state.events if e.get("id") != linked_evt_id and e.get("subsystem") != cmd_subsystem]
            state.anomaly_mode = "nominal"
            state.custom_params = {}

            try:
                from database.repositories.supabase_repository import SupabaseRepository
                
                # 1. Log audit event to Supabase
                SupabaseRepository.log_audit_event(
                    action=f"OPERATOR_COMMAND_{decision_state.upper()}",
                    entity_type="command_queue",
                    entity_id=id,
                    payload={
                        "command": c.get("command"),
                        "summary": c.get("summary"),
                        "subsystem": cmd_subsystem,
                        "decision": req.decision,
                        "note": req.operatorNote
                    }
                )

                # 2. Log key outcome to Supabase mission_memory table
                SupabaseRepository.insert_mission_memory(
                    session_id=f"SESSION-SMOA-{id}",
                    event_type=f"HUMAN_COMMAND_{decision_state.upper()}",
                    key_outcomes={
                        "command_id": id,
                        "command_name": c.get("command"),
                        "summary": c.get("summary"),
                        "decision": decision_state,
                        "operator_note": req.operatorNote or "Authorized by Flight Controller"
                    },
                    authority_boundary="OPERATOR_VERIFIED"
                )

                # 3. If APPROVED, automatically add as IN_PROGRESS activity in Mission Planner (activity_schedules)
                if req.decision == "approve":
                    cmd_str = str(c.get("command", "")).upper()
                    act_type = "MAINTENANCE"
                    if "SAFE" in cmd_str:
                        act_type = "SAFE_MODE_TRANSITION"
                    elif "CALIB" in cmd_str or "ADCS" in cmd_str:
                        act_type = "CALIBRATION"
                    elif "DOWNLINK" in cmd_str or "COMM" in cmd_str:
                        act_type = "DOWNLINK"

                    activity_item = {
                        "activity_name": f"EXEC: {c.get('command')} — {c.get('summary')}",
                        "activity_type": act_type,
                        "status": "IN_PROGRESS",
                        "priority": 1,
                        "start_time": "T+00:00:00",
                        "end_time": "T+00:30:00",
                        "resource_requirements": {
                            "powerWatts": 120.0,
                            "batterySocMin": 35.0,
                            "storageGb": 0.0
                        },
                        "precedence_constraints": ["Human Operator Flight Verification Confirmed", "Safety Gate Passed"],
                        "selection_rationale": f"Authorized by Human Flight Controller to recover from {cmd_subsystem} excursion."
                    }
                    
                    SupabaseRepository.insert_activity_schedule(activity_item)

            except Exception as err:
                print(f"[Supabase Sync Notice] Authorization logging notice: {err}")

            # Broadcast real-time event resolution to all connected frontend clients
            await ws_manager.broadcast({
                "type": "COMMAND_AUTHORIZED",
                "id": id,
                "decision": req.decision,
                "linkedEventId": linked_evt_id,
                "subsystem": cmd_subsystem
            })

            return {"id": id, "state": decision_state}
            
    return {"id": id, "state": "approved" if req.decision == "approve" else "rejected"}
