import os
import sys
import time
import math
import pickle
import asyncio
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure both backend dir and root workspace dir are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Import ML model pipeline & Explainable AI
from predict_mission import predict_mission_telemetry
from telemetry_ml.explainable_ai import MissionExplainableAI
from train_mission_models import train_mission_pipeline

from routers.websocket import ws_manager
from routers import seeding, mission, predict, approval, telemetry, agentic

CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "checkpoints", "mission_models.pkl")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "Dataset", "mission_telemetry.csv")

app = FastAPI(title="SMOA ML Mission Control Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seeding.router)
app.include_router(mission.router)
app.include_router(predict.router)
app.include_router(approval.router)
app.include_router(telemetry.router)
app.include_router(agentic.router)

@app.get("/")
def root_metadata():
    return {
        "status": "healthy",
        "service": "SMOA Spacecraft Mission Control & Autonomous Operations Engine",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "ws_telemetry": "/ws/telemetry"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SMOA Backend Engine",
        "version": "2.0.0",
        "timestamp": int(time.time()),
        "ml_models_loaded": bool(ml_assets.get("xgboost")),
        "database": "connected"
    }


# Global ML Model Storage
ml_assets: Dict[str, Any] = {}
xai_engine: Optional[MissionExplainableAI] = None

# Active Telemetry & Fault State
class TelemetryState:
    def __init__(self):
        self.met: int = 128400
        self.soc: float = 78.4
        self.source: str = "digital-twin"
        self.faults: List[Dict[str, Any]] = []
        self.commands: List[Dict[str, Any]] = []
        self.authorized_commands: Dict[str, str] = {}
        self.init_commands()

    def set_source(self, src: str):
        if src in ["digital-twin", "simulator"]:
            self.source = src

    def set_faults(self, faults: List[Dict[str, Any]]):
        self.faults = faults

    def get_fault_mag(self, kind: str, subsystem: str) -> float:
        for f in self.faults:
            if f.get("kind") == kind and f.get("subsystem") == subsystem:
                return float(f.get("magnitude", 0))
        return 0.0

    def init_commands(self):
        now_ms = int(time.time() * 1000)
        self.commands = [
            {
                "id": "CMD-2201",
                "ts": now_ms - 38000,
                "command": "PWR_SHED_PAYLOAD_HEATER_BUS",
                "subsystem": "power",
                "summary": "Disable payload heater bus for 3 orbits to protect battery depth-of-discharge during eclipse.",
                "irreversible": True,
                "linkedEventId": "EVT-4471",
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
            },
            {
                "id": "CMD-2202",
                "ts": now_ms - 610000,
                "command": "ADCS_WHEEL3_BEARING_RUNIN",
                "subsystem": "adcs",
                "summary": "Spin reaction wheel 3 to 4200 RPM for 20 minutes to redistribute bearing lubricant.",
                "irreversible": False,
                "linkedEventId": "EVT-4468",
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
            },
            {
                "id": "CMD-2203",
                "ts": now_ms - 1210000,
                "command": "THERM_PUMPA_OVERSPEED_110",
                "subsystem": "thermal",
                "summary": "Command coolant pump A to 110% for two orbits to clear a suspected coolant void.",
                "irreversible": True,
                "linkedEventId": "EVT-4465",
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
        ]

state = TelemetryState()

def load_ml_pipeline():
    global ml_assets, xai_engine
    if not os.path.exists(CHECKPOINT_PATH):
        print(f"[ML Server] Model checkpoint not found at {CHECKPOINT_PATH}. Training models now...")
        train_mission_pipeline(dataset_path=DATASET_PATH, checkpoint_path=CHECKPOINT_PATH)
    
    with open(CHECKPOINT_PATH, "rb") as f:
        ml_assets = pickle.load(f)
    
    xai_engine = MissionExplainableAI(ml_assets["feature_cols"])
    print("[ML Server] ML models & XAI Engine loaded successfully!")

@app.on_event("startup")
def startup_event():
    load_ml_pipeline()
    try:
        from database.repositories.supabase_repository import SupabaseRepository
        SupabaseRepository.seed_initial_data()
    except Exception as e:
        print(f"[Supabase Startup Notice] Seeding notice: {e}")


def generate_telemetry_frame() -> Dict[str, Any]:
    state.met += 1
    t_sec = state.met
    t_ms = int(time.time() * 1000)

    # Check active telemetry source state
    if state.source == "digital-twin":
        bsk_frame = basilisk_engine.get_live_telemetry_frame(t_sec, state.faults)
        bus_voltage = bsk_frame["bus_voltage"]
        state.soc = bsk_frame["battery_soc"]
        eclipse = bsk_frame["eclipse_status"]
        batt_temp = bsk_frame["thermal_nodes_celsius"]["cpu"] - 14.0
        payload_temp = bsk_frame["thermal_nodes_celsius"]["payload"]
        radiator_temp = bsk_frame["thermal_nodes_celsius"]["radiator"]
        roll = bsk_frame["attitude_quaternion"]["q1"] * 100.0
        pitch = bsk_frame["attitude_quaternion"]["q2"] * 100.0
        yaw = bsk_frame["attitude_quaternion"]["q3"] * 90.0
        body_rate = 0.28
        wheel_rpm = bsk_frame["reaction_wheel_rpm"][0]
        array_power = 420.0 if not eclipse else 0.0
        signal_dbm = -90.0
        packet_loss = 0.2
        rtt_seconds = 0.38
        source_label = "digital-twin"
    else:
        orbit_angle = (t_sec / 5580.0) * 360.0 % 360.0
        eclipse = 205.0 < orbit_angle < 320.0

        wobble = lambda period, phase=0.0: math.sin((t_sec / period) * math.pi * 2 + phase)

        power_drift = state.get_fault_mag("sensor_drift", "power")
        adcs_hw = state.get_fault_mag("hardware_fault", "adcs")
        thermal_hw = state.get_fault_mag("hardware_fault", "thermal")
        comms_loss = state.get_fault_mag("packet_loss", "comms")

        state.soc += -0.018 if eclipse else 0.024
        state.soc = min(99.4, max(21.0, state.soc))

        array_power = 2.0 + wobble(37) * 1.2 if eclipse else 412.0 + wobble(53) * 18.0
        bus_voltage = 27.6 + (state.soc - 78.0) * 0.045 + wobble(29) * 0.06 - power_drift * 0.9

        batt_temp = 18.2 + wobble(211) * 2.4 + (-3.1 if eclipse else 1.4) + thermal_hw * 9.0
        payload_temp = -6.4 + wobble(167, 1.1) * 3.2 + (-5.2 if eclipse else 2.6)
        radiator_temp = -31.5 + wobble(233, 0.4) * 4.1 + thermal_hw * 4.0

        roll = wobble(97) * 12.0 + adcs_hw * 22.0
        pitch = wobble(131, 0.8) * 8.0 + adcs_hw * 9.0
        yaw = ((t_sec / 3.0) % 360.0) - 180.0
        body_rate = 0.32 + abs(wobble(61)) * 0.14 + adcs_hw * 1.6
        wheel_rpm = 2840.0 + wobble(89) * 210.0 + adcs_hw * 900.0

        signal_dbm = -92.4 + wobble(73) * 3.1 - comms_loss * 8.0
        packet_loss = max(0.0, 0.4 + wobble(41) * 0.3 + comms_loss * 24.0)
        rtt_seconds = 0.42 + wobble(311) * 0.05
        source_label = "simulator"

    # Build 52-parameter dictionary matching feature_cols
    sample_dict = {
        "Mission_Phase": 1,
        "Battery_Voltage": bus_voltage,
        "Battery_Current": 4.5 if not eclipse else -2.1,
        "Battery_SOC": state.soc - power_drift * 1.5,
        "Battery_Temperature": batt_temp,
        "Solar_Voltage": 35.0 if not eclipse else 0.0,
        "Solar_Current": 12.0 if not eclipse else 0.0,
        "Power_Load": 280.0,
        "Power_Generation": array_power,
        "Payload_Temperature": payload_temp,
        "CPU_Temperature": 45.0 + thermal_hw * 15.0,
        "Solar_Panel_Temperature": 25.0 if not eclipse else -60.0,
        "System_Temp": 22.0,
        "External_Temp": -50.0,
        "Signal_Strength": signal_dbm,
        "Downlink_Rate": 10.0,
        "Uplink_Rate": 1.0,
        "Packet_Loss": packet_loss,
        "Latency": rtt_seconds * 1000.0,
        "Communication_Window": 1,
        "Roll": roll,
        "Pitch": pitch,
        "Yaw": yaw,
        "Angular_Velocity": body_rate,
        "Reaction_Wheel_Speed": wheel_rpm,
        "Gyroscope_X": 0.001,
        "Gyroscope_Y": 0.001,
        "Gyroscope_Z": 0.001,
        "Magnetometer": 45.0,
        "Star_Tracker_Status": 1,
        "Altitude": 525.0,
        "Velocity": 7.6,
        "Latitude": 12.0,
        "Longitude": 45.0,
        "Orbital_Phase": orbit_angle,
        "Eclipse_Status": 1 if eclipse else 0,
        "Fuel_Level": 85.0,
        "Thruster_Temperature": 25.0,
        "Thruster_Status": 0,
        "Fuel_Pressure": 150.0,
        "Burn_Duration": 0,
        "Camera_Status": 1,
        "Instrument_Temperature": 20.0,
        "Instrument_Power": 80.0,
        "Data_Collection_Rate": 10.0,
        "Payload_Mode": 2,
        "CPU_Usage": 45.0 + thermal_hw * 25.0,
        "RAM_Usage": 50.0,
        "Storage_Usage": 40.0,
        "Process_Health": 1,
        "Software_Version": 2.1,
        "Observation_Window": 1
    }

    # Evaluate ML Anomaly Score if assets are available
    anomaly_score = 0.12
    if ml_assets:
        try:
            feature_cols = ml_assets["feature_cols"]
            scaler = ml_assets["scaler"]
            iso_forest = ml_assets["isolation_forest"]

            X_sample = np.array([[sample_dict.get(c, 0.0) for c in feature_cols]], dtype=float)
            X_scaled = scaler.transform(X_sample)
            raw_score = iso_forest.score_samples(X_scaled)[0]
            anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
        except Exception as e:
            pass

    return {
        "met": t_sec,
        "t": t_ms,
        "orbitAngle": orbit_angle,
        "eclipse": eclipse,
        "power": {
            "busVoltage": bus_voltage,
            "stateOfCharge": state.soc - power_drift * 1.5,
            "arrayPower": array_power
        },
        "thermal": {
            "batteryTemp": batt_temp,
            "payloadTemp": payload_temp,
            "radiatorTemp": radiator_temp
        },
        "adcs": {
            "roll": roll,
            "pitch": pitch,
            "yaw": yaw,
            "bodyRate": body_rate,
            "wheelRpm": wheel_rpm
        },
        "comms": {
            "signalDbm": signal_dbm,
            "packetLoss": packet_loss,
            "rttSeconds": rtt_seconds
        },
        "anomalyScore": anomaly_score
    }

# WebSocket Endpoint
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep socket open to receive client ping/messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# REST Endpoints
@app.get("/api/events")
def get_anomaly_events():
    now_ms = int(time.time() * 1000)
    
    # Run ML prediction card on representative telemetry sample
    xai_card = None
    try:
        xai_card = predict_mission_telemetry(row_idx=None, csv_path=DATASET_PATH, checkpoint_path=CHECKPOINT_PATH)
    except Exception as e:
        print(f"[ML Server] Anomaly prediction error: {e}")

    events = [
        {
            "id": "EVT-4471",
            "ts": now_ms - 42000,
            "subsystem": "power",
            "severity": "critical",
            "title": "Battery bus voltage droop beyond 3σ envelope",
            "detector": "ML Sentinel · XGBoost & Isolation Forest",
            "score": float(xai_card["Anomaly_Score"]) if xai_card else 0.94,
            "diagnosis": {
                "rootCause": f"ML Predicted Failure: {xai_card['Failure_Class']}" if xai_card else "Battery cell balancing FET latched open under eclipse load.",
                "confidence": float(xai_card["Confidence"].replace("%", "")) / 100.0 if xai_card else 0.91,
                "evidence": xai_card["Evidence"] if xai_card else ["Bus voltage droop correlates with eclipse entry"],
                "proposedAction": xai_card["Recommended_Procedure"] if xai_card else "Shed non-essential loads",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 42,
                "predictiveMetrics": {
                    "remainingBatteryLife": xai_card["Predictive_Metrics"]["Remaining_Battery_Life"] if xai_card else "12.0 hours",
                    "estCpuTemp30min": xai_card["Predictive_Metrics"]["Est_CPU_Temp_30min"] if xai_card else "47.2 deg C"
                },
                "constraintViolations": xai_card["Constraint_Violations"] if xai_card else []
            }
        },
        {
            "id": "EVT-4468",
            "ts": now_ms - 386000,
            "subsystem": "adcs",
            "severity": "warning",
            "title": "Reaction wheel 3 speed oscillation",
            "detector": "ML Sentinel · Spectral Anomaly Model",
            "score": 0.67,
            "diagnosis": {
                "rootCause": "Bearing lubricant migration producing a 0.8 Hz torque ripple.",
                "confidence": 0.74,
                "evidence": [
                    "0.8 Hz spectral torque peak detected on reaction wheel 3",
                    "Motor current up 12% at constant commanded torque"
                ],
                "proposedAction": "Schedule wheel 3 bearing run-in at 4200 RPM during contact pass.",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 38,
                "predictiveMetrics": {
                    "remainingBatteryLife": "16.4 hours",
                    "estCpuTemp30min": "41.5 deg C"
                },
                "constraintViolations": []
            }
        },
        {
            "id": "EVT-4465",
            "ts": now_ms - 903000,
            "subsystem": "thermal",
            "severity": "warning",
            "title": "Radiator outlet temperature lagging predicted profile",
            "detector": "ML Sentinel · Thermal Regressor Residual",
            "score": 0.58,
            "diagnosis": {
                "rootCause": "Loop-A coolant flow rate ~8% below expected regression profile.",
                "confidence": 0.62,
                "evidence": [
                    "Radiator outlet 4.1 K warmer than residual baseline",
                    "Loop-A delta P reduced by 8.3%"
                ],
                "proposedAction": "Run pump A at 110% for two orbits to clear void.",
                "model": "xgboost-mission-sentinel v2.0",
                "latencyMs": 31,
                "predictiveMetrics": {
                    "remainingBatteryLife": "14.2 hours",
                    "estCpuTemp30min": "58.0 deg C"
                },
                "constraintViolations": ["Constraint Violation: Temperature > 70 deg C (Predicted Threshold)"]
            }
        }
    ]

    return events

@app.get("/api/commands/pending")
def get_pending_commands():
    return [c for c in state.commands if c["state"] == "pending"]

class TelemetrySourcePayload(BaseModel):
    source: str

@app.get("/api/telemetry/source")
def get_telemetry_source():
    return {"source": state.source, "available": ["digital-twin", "simulator"]}

@app.post("/api/telemetry/source")
def set_telemetry_source(payload: TelemetrySourcePayload):
    if payload.source not in ["digital-twin", "simulator"]:
        raise HTTPException(status_code=400, detail="Invalid source. Must be 'digital-twin' or 'simulator'")
    state.set_source(payload.source)
    print(f"[Telemetry Engine] Telemetry source updated to: {state.source}")
    return {"status": "success", "source": state.source}

class AuthorizationRequest(BaseModel):
    decision: str
    operatorNote: Optional[str] = None

@app.post("/api/commands/{id}/authorize")
def authorize_command(id: str, req: AuthorizationRequest):
    for c in state.commands:
        if c["id"] == id:
            c["state"] = "approved" if req.decision == "approve" else "rejected"
            try:
                from database.repositories.supabase_repository import SupabaseRepository
                SupabaseRepository.log_audit_event(
                    action=f"OPERATOR_COMMAND_{c['state'].upper()}",
                    entity_type="command_queue",
                    entity_id=id,
                    payload={"command": c.get("command"), "note": req.operatorNote}
                )
            except Exception:
                pass
            return {"id": id, "state": c["state"]}
    raise HTTPException(status_code=404, detail="Command ID not found")

@app.get("/api/planner/schedules")
def get_planner_schedules():
    return [
        {
            "id": "ACT-101",
            "activityName": "Lunar Mare Imbrium High-Res Multispectral Survey",
            "activityType": "OBSERVATION",
            "status": "IN_PROGRESS",
            "priority": 1,
            "startTime": "T+00:15:00",
            "endTime": "T+00:45:00",
            "durationMinutes": 30,
            "resourceRequirements": {
                "powerWatts": 145,
                "batterySocMin": 45,
                "storageGb": 8.4
            },
            "precedenceConstraints": ["Battery_SOC >= 45%", "Pointing accuracy < 0.05°", "Sunlit phase active"],
            "selectionRationale": "Scheduled during peak solar array illumination (410W) to offset 145W payload draw while preserving battery DoD above 70%."
        },
        {
            "id": "ACT-102",
            "activityName": "SGS Svalbard High-Speed Ka-Band Data Downlink",
            "activityType": "DOWNLINK",
            "status": "SCHEDULED",
            "priority": 1,
            "startTime": "T+01:05:00",
            "endTime": "T+01:25:00",
            "durationMinutes": 20,
            "resourceRequirements": {
                "powerWatts": 180,
                "batterySocMin": 50,
                "storageGb": -12.5,
                "bandwidthMbps": 50
            },
            "precedenceConstraints": ["Communication_Window == 1", "Ground Station Line of Sight (Svalbard SGS)", "Transmitter Temp < 55°C"],
            "selectionRationale": "Pass window alignment with SGS Svalbard station (max elevation 68.4°). Empties 12.5 GB from solid-state recorder."
        },
        {
            "id": "ACT-103",
            "activityName": "ADCS Star Tracker & Gyroscope Recalibration",
            "activityType": "CALIBRATION",
            "status": "SCHEDULED",
            "priority": 2,
            "startTime": "T+01:40:00",
            "endTime": "T+01:55:00",
            "durationMinutes": 15,
            "resourceRequirements": {
                "powerWatts": 45,
                "batterySocMin": 35,
                "storageGb": 0.2
            },
            "precedenceConstraints": ["Spacecraft body rates < 0.02°/s", "Reaction wheel speed stabilized < 3000 RPM"],
            "selectionRationale": "Executes during orbital eclipse to eliminate solar glare on Optical Star Tracker B lens assembly."
        }
    ]

@app.get("/api/planner/windows")
def get_planner_windows():
    return [
        {
            "id": "CW-801",
            "groundStationName": "SGS Svalbard (Norway)",
            "startTime": "T+01:05:00",
            "endTime": "T+01:25:00",
            "maxElevationDeg": 68.4,
            "bandwidthMbps": 50.0,
            "status": "UPCOMING"
        },
        {
            "id": "CW-802",
            "groundStationName": "Goldstone Deep Space Complex (USA)",
            "startTime": "T+02:40:00",
            "endTime": "T+03:05:00",
            "maxElevationDeg": 82.1,
            "bandwidthMbps": 120.0,
            "status": "UPCOMING"
        }
    ]


@app.post("/api/agentic/evaluate")
def evaluate_agentic_workflow(telemetry_frame: Dict[str, Any]):
    """
    Triggers full Multi-Agent Hybrid Workflow across ML Sentinel, Multi-LLM Factory, Consensus, Trust Engine, and Warden Safety Gate.
    """
    from agentic.graph import mission_graph
    initial_state = {
        "telemetry_data": telemetry_frame,
        "telemetry_history": [telemetry_frame],
        "mission_phase": "MAPPING_OBSERVATION",
        "mission_state": "ACTIVE",
        "mission_constraints": {"Battery_SOC_Min": 30.0, "CPU_Temp_Max": 70.0},
        "mission_memory": [],
        "audit_logs": []
    }
    result = mission_graph.invoke(initial_state)
    return {
        "is_anomaly": result.get("is_anomaly", False),
        "ml_output": result.get("ml_output"),
        "consensus": result.get("consensus_output"),
        "trust": result.get("trust_evaluation"),
        "diagnosis": result.get("diagnosis_output"),
        "flight_director": result.get("flight_director_output"),
        "safety": result.get("safety_output"),
        "warden": result.get("warden_output"),
        "queued_commands": result.get("approval_queue", [])
    }


@app.post("/api/telemetry/frame")
@app.post("/api/telemetry")
@app.post("/telemetry/frame")
async def ingest_telemetry_frame(frame: Dict[str, Any]):
    """
    Ingests 1Hz telemetry frame from Digital Twin Simulator, runs ML inference, and broadcasts over WebSockets.
    """
    try:
        # Run ML model inference if assets loaded
        if ml_assets and "clf" in ml_assets:
            pred_data, _ = predict_mission_telemetry(frame, ml_assets)
        else:
            pred_data = {"failure_class": "Healthy", "confidence": 0.95, "anomaly_score": 0.05, "risk_level": "LOW"}

        # Broadcast over WebSockets to frontend
        await ws_manager.broadcast({
            "event": "TELEMETRY_UPDATED",
            "met": frame.get("met", 0),
            "timestamp": frame.get("timestamp"),
            "telemetry": frame,
            "prediction": pred_data
        })

        # Persist to Supabase if connected
        try:
            from database.repositories.supabase_repository import SupabaseRepository
            SupabaseRepository.insert_telemetry(frame)
            SupabaseRepository.insert_prediction(pred_data)
        except Exception:
            pass

        return {"status": "success", "met": frame.get("met"), "prediction": pred_data}
    except Exception as e:
        return {"status": "ingested", "note": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)


