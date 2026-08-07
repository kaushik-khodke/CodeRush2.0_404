# 🚀 SMOA — Space Mission Operations Automator (ORION AI)
## Comprehensive Technical System Architecture & Implementation Report

---

## 🏛️ Executive Summary

**Space Mission Operations Automator (SMOA / ORION AI)** is an enterprise-grade, aerospace-inspired **Autonomous Satellite Mission Control & Multi-Agent AI System**. It is engineered to monitor high-frequency 52-parameter satellite telemetry streams, perform real-time machine learning anomaly detection, execute parallel multi-LLM diagnostic reasoning, evaluate physical constraint trust metrics, run high-fidelity orbital Digital Twin physics simulations, and enforce strict human-in-the-loop command safety gates.

---

## 📐 End-to-End System Architecture

```
                                 [ Basilisk Digital Twin Simulator ]
                                (Physics, Orbit, Subsystems, Faults)
                                                 │
                                                 ▼
                                     [ Telemetry Bridge (1Hz) ]
                                                 │
                                                 ▼
                                     [ Supabase Realtime DB ]
                                  (PostgreSQL CDC, 14 Schema Tables)
                                                 │
                                                 ▼
                                       [ FastAPI Backend API ]
                                  (WebSockets, XAI Engine, Routes)
                                                 │
                                                 ▼
                                        [ ML Sentinel Agent ]
                                (XGBoost + Isolation Forest + RF)
                                                 │
                                                 ▼
                                   [ Context Packaging Engine ]
                                                 │
                                                 ▼
                                   ──── Multi-LLM Factory ────
                                  │         │        │        │
                                Groq     Gemini   OpenAI   Ollama
                                  │         │        │        │
                                  └─────────┼────────┼────────┘
                                            │
                                            ▼
                                    [ Consensus Engine ]
                                (Multi-Model Voting & Matching)
                                            │
                                            ▼
                                      [ Trust Engine ]
                                (0-100 Score + Safety Gate)
                                            │
                                            ▼
                                      [ Safety Agent ]
                            (SHA-256 Signatures, Injection Guard)
                                            │
                                            ▼
                                      [ Warden Gate ]
                           (Human-in-the-Loop Approval Queue)
                                            │
                                            ▼
                                  [ Mission Control UI ]
                       (3D Attitude Viewer, Gauges, Replay, Planner)
```

---

## 🧩 1. Database & Persistence Layer (`Supabase / PostgreSQL`)

The persistence engine relies on **Supabase Cloud PostgreSQL** featuring **Row Level Security (RLS)** and **Supabase Realtime Change Data Capture (CDC)** over WebSockets across **14 core tables**:

| Table Name | Description & Stored Attributes |
| :--- | :--- |
| **`telemetry_data`** | High-frequency 1Hz 52-parameter satellite telemetry frames (Power, Thermal, ADCS, Comms, Orbit, Propulsion, Payload, Computer). |
| **`predictions`** | ML Sentinel output (Failure class, XGBoost confidence %, Isolation Forest anomaly score, 30m temperature forecast, remaining battery life). |
| **`anomalies`** | Detected anomaly events, severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), competing hypotheses, and resolution status. |
| **`approval_queue`** | Human Approval Queue items, operator verification status (`PENDING`, `APPROVED`, `REJECTED`), and safety gate checks. |
| **`procedures`** | Versioned Standard Operating Procedure (SOP) runbooks, preconditions, postconditions, and safety precautions. |
| **`mission_memory`** | Long-term operational memories, historical anomaly resolutions, operator actions, and composite 0–100 Trust Scores. |
| **`audit_log`** | Cryptographic security audit trail (`SEC-SIG-...`), user actions, command authorizations, and timestamps. |
| **`mission_plan`** | Current satellite mission phase (`ORBIT_INSERTION`, `MAPPING_OBSERVATION`, `SAFE_MODE`), target orbit parameters, and status. |
| **`activity_schedules`** | Google OR-Tools optimized activity schedules, resource allocations, and precedence constraints. |
| **`communication_windows`** | Ground station contact windows (AOS/LOS pass times, station elevation, available bandwidth in Mbps). |
| **`mission_constraints`** | Parameter safety thresholds (Min/Max limits, units, criticality flags for Battery SOC, CPU Temp, Fuel Level). |
| **`fault_injection`** | Active simulated faults (sensor drift, hardware fault, packet loss magnitude). |
| **`simulation_replays`** | Digital Twin forward-projection snapshot histories and operator decision replays. |
| **`users`** | Operator and Flight Director authentication credentials, email addresses, and security roles. |

---

## 🤖 2. Machine Learning Pipeline (`Backend/telemetry_ml/`)

**Strict System Boundary Rule**: *ML models are the ONLY component responsible for anomaly classification and quantitative confidence scoring. LLMs NEVER classify raw anomalies.*

```
                 Telemetry Frame (52 Features)
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
Isolation Forest (Stream Baseline)       XGBoost Classifier
  (Anomaly Score 0.00 - 1.00)        (5-Class Failure Classifier)
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
                 Explainable AI (XAI) Engine
            (Feature Attribution & SHAP Metrics)
```

1. **Isolation Forest (Stream Baseline)**: Unsupervised anomaly detection scoring overall deviation from nominal telemetry distributions (0.00 = Nominal, 1.00 = Critical Anomaly).
2. **XGBoost Classifier**: Supervised 5-class fault classification:
   - `Healthy`
   - `Battery Cell Degradation / Bus Voltage Droop`
   - `Thermal Runaway / Coolant Flow Obstruction`
   - `Communication Noise / High Packet Loss`
   - `ADCS Reaction Wheel Desaturation / Bearing Failure`
3. **Random Forest Regressors**:
   - `estCpuTemp30min`: 30-minute forward thermal forecast.
   - `remainingBatteryLife`: Estimated battery life under current load.
4. **Explainable AI (XAI) Engine**: Extracts top feature attributions (e.g., `Battery_Voltage`, `CPU_Temperature`) explaining the root cause of every ML prediction.

---

## 🧠 3. Hybrid Multi-Agent AI & LLM Factory (`Backend/agentic/`)

### A. Multi-LLM Provider Architecture (`Backend/agentic/llm/`)
To eliminate single-point-of-failure reliance on Groq, the system runs a parallel multi-provider **LLM Factory**:

* **GroqProvider**: `llama-3.3-70b-versatile` (Fast, high-throughput diagnostic reasoning)
* **GeminiProvider**: `gemini-3.5-flash-lite` (Google DeepMind multimodal & speed optimized)
* **OpenAIProvider**: `gpt-4o-mini` (High precision structured JSON validation)
* **OllamaProvider**: `qwen2.5-coder:7b` (Air-gapped local offline model fallback)

### B. Consensus Engine (`Backend/agentic/consensus/engine.py`)
Queries all LLM providers in parallel without inter-model communication to prevent hallucination contamination:
* **$\ge 75\%$ Agreement ($3/4$ models)** $\rightarrow$ **`HIGH` Consensus** (Outlier hallucinations discarded).
* **$\ge 50\%$ Agreement ($2/4$ models)** $\rightarrow$ **`MEDIUM` Consensus**.
* **$< 50\%$ Agreement** $\rightarrow$ **`REQUIRES HUMAN REVIEW`** (Escalates directly to Flight Director).

### C. Trust Engine (`Backend/agentic/trust/engine.py`)
Calculates a composite **0–100 Trust Score**:
$$\text{Trust Score} = 0.25(\text{ML Conf}) + 0.25(\text{Consensus}) + 0.20(\text{Constraints}) + 0.15(\text{Sim}) + 0.10(\text{Memory}) + 0.05(\text{Evidence})$$

> [!IMPORTANT]
> **Hard Safety Circuit Breaker**: If any model hallucinates a recommendation that violates safety constraints (e.g. Battery SOC $< 30\%$ or CPU Temp $> 70^\circ\text{C}$), the Trust Score **instantly drops to 0** (`REJECTED_SAFETY_VIOLATION`), blocking execution.

### D. Safety Agent (`Backend/agentic/agents/safety.py`)
Applies cyber-security validation, prompt injection defense, prohibited keyword filters, and generates a cryptographic **SHA-256 Signature** (`SEC-SIG-...`) for every approved action.

### E. LangGraph StateGraph Workflow (`Backend/agentic/graph/`)
Interconnects **9 specialized autonomous agents**:
1. `TelemetryMonitorAgent`: Monitors 1Hz stream against mission thresholds.
2. `MLSentinelAgent`: Invokes XGBoost & Isolation Forest pipelines.
3. `DiagnosisAgent`: Solves root causes via Multi-LLM Factory.
4. `ArchivistAgent`: Searches past mission memory via Supabase RAG.
5. `SimulationAgent`: Executes forward Digital Twin projections.
6. `PlannerAgent`: Schedules activity sequences using Google OR-Tools.
7. `FlightDirectorAgent`: Synthesizes consensus, trust score, and recommendations.
8. `SafetyAgent`: Validates security & generates cryptographic signatures.
9. `WardenAgent`: Manages the Human-in-the-Loop Approval Queue.

### F. Observability (`Langfuse`)
Tracks every LLM generation across models (`llama-3.3-70b-versatile`, `gemini-3.5-flash-lite`, `gpt-4o-mini`, `qwen2.5-coder:7b`) on **Langfuse Cloud** (`us.cloud.langfuse.com`).

---

## 🛰️ 4. Basilisk Digital Twin Simulator Engine (`simulator/`)

The Digital Twin Simulator provides realistic spacecraft dynamics and physical subsystem simulation inside an isolated `simulator/` directory:

```
simulator/
├── basilisk/
│   ├── core/
│   │   ├── simulation.py      # Basilisk Task Group & Orbital Physics Engine
│   │   ├── mission.py         # Spacecraft & Orbit Parameters
│   │   ├── clock.py           # Mission Elapsed Time (MET) Clock
│   │   └── state.py           # Rigid-Body Orbital State (r, v, q, w)
├── bridge/
│   └── telemetry_bridge.py    # Isolated Telemetry Sender to Backend (8000)
├── subsystems/                # Coupled Physics Models
│   ├── power.py               # Battery SOC, Voltage, Solar Charging
│   ├── thermal.py             # Nodal Heat Balance (CPU, Payload, Radiator)
│   ├── communication.py       # Friis Path Loss, Signal dBm, Latency, Pass Windows
│   ├── payload.py             # Multispectral Camera & Instrument Power
│   ├── computer.py            # CPU Load, RAM Usage, Process Health
│   ├── storage.py             # Solid-State Recorder Buffer Usage (GB)
│   ├── adcs.py                # Reaction Wheels, Gyroscopes, Magnetometers
│   ├── propulsion.py          # Thruster Impulse & Fuel Pressure
│   └── environment.py         # Eclipse Shadow Geometry & Solar Flux
├── faults/                    # Plugin Fault Injection Architecture
│   ├── battery_failure.py     # Cell Short-Circuit / Voltage Droop
│   ├── solar_panel_failure.py # Solar Array Degradation
│   ├── thermal_fault.py       # Coolant Pump Failure / Thermal Runaway
│   ├── packet_loss.py         # Communication Noise & Packet Loss
│   ├── sensor_drift.py        # Telemetry Sensor Calibration Drift
│   ├── reaction_wheel_failure.py # Torque Ripple & Bearing Failure
│   ├── communication_loss.py  # Total Blackout
│   ├── thruster_failure.py    # Latch Valve Failure
│   └── multiple_faults.py     # Multiple Simultaneous Cascading Faults
├── telemetry/
│   ├── generator.py           # 52-Parameter Telemetry Formatter
│   ├── publisher.py           # Async 1Hz Stream Publisher Loop
│   └── schemas.py             # Telemetry Pydantic Validation
├── scenarios/
│   ├── earth_observation.py   # LEO 520km Sun-Sync Scenario
│   ├── moon_mapper.py         # 100km Lunar Polar Mapping Scenario
│   ├── mars_orbiter.py        # Mars Elliptical Science Orbit Scenario
│   └── safe_mode_demo.py      # Emergency Safe Mode AI Recovery Scenario
└── replay/
    └── replay_engine.py       # Time-Series Snapshot Replay Engine
```

---

## 🖥️ 5. User Interface & Dashboard Suite (`Frontend/`)

Built with **Vite + React + TypeScript + TailwindCSS + Three.js**:

1. **Main Mission Console (`http://localhost:5173`)**:
   - Real-time 3D Spacecraft Attitude Viewer (Three.js).
   - 52-parameter Telemetry Gauges (Power load, Battery SOC, CPU Temp, Signal dBm).
   - Live Anomaly Stream & Diagnostic Cards.
   - Human Approval Queue & Warden Safety Controls.
2. **Digital Twin Visual Replay Console (`http://localhost:5173/replay`)**:
   - Timeline scrubbing bar for historical incident analysis.
   - Synced 3D Attitude model playback.
   - Anomaly flag timelines & operator decision logs.
3. **AI Mission Planner (`http://localhost:5173/planner`)**:
   - Google OR-Tools precedence constraint solver schedule.
   - Ground Station communication pass windows (AOS/LOS, elevation, bandwidth).
4. **Data Seeding & Fault Injector App (`http://localhost:5174`)**:
   - Interactive fault trigger panel for live satellite testing.

---

## ⚡ 6. System Execution & Operational Commands

### A. Run All-in-One Mission Control Services
```powershell
python start_all.py
```

### B. Stream Live 1Hz Basilisk Digital Twin Telemetry
```powershell
python stream_digital_twin.py
```

### C. Run Digital Twin Verification Suite
```powershell
python simulator/test_digital_twin.py
```

### D. Run End-to-End Multi-Agent Layer Test
```powershell
python test_agentic_layer.py
```

---

## 🎯 Summary Matrix

| Metric / Feature | Capability |
| :--- | :--- |
| **Telemetry Frequency** | 1Hz Real-Time Stream (52 Features) |
| **Database Persistence** | Supabase Cloud PostgreSQL (14 Schema Tables + RLS) |
| **Realtime Protocol** | WebSockets + Supabase CDC |
| **ML Classifiers** | XGBoost (5 Classes) + Isolation Forest (Unsupervised Baseline) |
| **ML Regressors** | Random Forest (30m Temp Forecast & Battery Remaining Life) |
| **LLM Provider Integration** | Groq (`llama-3.3-70b`), Gemini (`gemini-3.5-flash-lite`), OpenAI (`gpt-4o-mini`), Ollama (`qwen2.5-coder:7b`) |
| **Consensus Mechanism** | Parallel Multi-Model Voting ($\ge 75\%$ High, $\ge 50\%$ Medium) |
| **Trust Engine** | 0–100 Composite Score + Hard Safety Constraint Circuit Breaker |
| **Security Validation** | SHA-256 Signatures + Prompt Injection Defense (`SafetyAgent`) |
| **Physics Engine** | Basilisk C++ Tasks / Physical Orbital Kinematics Fallback |
| **Fault Plugins** | 9 Subsystem Fault Injection Plugins + Cascading Multi-Faults |
| **User Interface** | 4 Web Consoles (Main, Replay, Planner, Seeding App) |
