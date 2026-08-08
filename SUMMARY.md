# 🚀 SMOA — Space Mission Operations Automator (ORION AI)
## Comprehensive Technical System Architecture, Repository Structure & Implementation Report

---

## 🏛️ Executive Summary

**Space Mission Operations Automator (SMOA / ORION AI)** is an enterprise-grade, aerospace-inspired **Autonomous Satellite Mission Control & Multi-Agent AI System**. It is engineered to monitor high-frequency 52-parameter satellite telemetry streams, perform real-time machine learning anomaly detection, execute parallel multi-LLM diagnostic reasoning, evaluate physical constraint trust metrics, run high-fidelity orbital Digital Twin physics simulations, and enforce strict human-in-the-loop command safety gates.

---

## 📂 Complete Repository Directory Structure

```text
CodeRush2.0_404/
├── Backend/                            # FastAPI Python Backend Engine
│   ├── agentic/                        # Multi-Agent AI System & LangChain/LangGraph Workflows
│   │   ├── agents/                     # Specialized Agents (MLSentinel, Safety, Warden, Planner)
│   │   ├── consensus/                  # Multi-LLM Consensus Voting Engine
│   │   ├── graph/                      # LangGraph StateGraph Workflow Definitions
│   │   ├── llm/                        # Multi-LLM Provider Factory (Groq, Gemini, OpenAI, Ollama)
│   │   ├── tracing.py                  # Langfuse Cloud Observability Tracing Helper
│   │   └── trust/                      # 0–100 Composite Trust Metric Engine
│   ├── checkpoints/                    # Pre-trained ML Sentinel Weights & Scalers (.pkl)
│   ├── database/                       # Supabase PostgreSQL Realtime Client & Schema Migrations
│   ├── Dataset/                        # Historical Telemetry Training CSVs & Synthesizers
│   ├── routers/                        # REST & WebSocket Route Handlers
│   │   ├── agentic.py                  # Multi-Agent Reasoning & Execution Endpoints
│   │   ├── approval.py                 # Warden Safety Gate & Human Approval Queue
│   │   ├── mission.py                  # Mission Planner & Activity Scheduler Routes
│   │   ├── predict.py                  # ML Sentinel Anomaly Prediction Endpoints
│   │   ├── seeding.py                  # Data Seeding Controller & Fault Injection Routes
│   │   └── telemetry.py                # 1Hz Telemetry WebSockets & Time-Series Endpoints
│   ├── services/                       # Core Business & Physics Services
│   │   ├── basilisk_simulator.py       # Basilisk Digital Twin 30m Predictive Physics Engine
│   │   ├── context_packaging.py        # Telemetry Snapshot to LLM Context Encoder
│   │   └── xai_engine.py               # SHAP Explainable AI Feature Attribution Engine
│   ├── telemetry_ml/                   # Machine Learning Models & Training Scripts
│   │   ├── feature_engineering.py      # 52-Parameter Feature Extractor & Normalizer
│   │   ├── isolation_forest.py         # Unsupervised Stream Anomaly Scorer
│   │   └── xgboost_model.py            # Supervised 5-Class Fault Classifier
│   ├── tests/                          # Pytest Automated Verification Suite
│   │   ├── __init__.py
│   │   ├── test_agentic_layer.py       # Multi-Agent Workflow Verification
│   │   └── test_full_suite.py          # End-to-End System, Health, & Digital Twin Tests
│   ├── .env                            # Externalized Environment Variables
│   ├── .env.example                    # Environment Template for Developers & Judges
│   ├── config.py                       # Pydantic Settings Application Config
│   ├── main.py                         # Alternative Server Entrypoint
│   ├── pytest.ini                      # Pytest Runner Configuration
│   ├── render.yaml                     # Render Backend Deployment Specification
│   ├── requirements.txt                # Explicit Python Dependencies Manifest
│   └── server.py                       # Main FastAPI Application & WebSocket Server
│
├── Frontend/                           # Vite + React 19 + TypeScript Portals
│   ├── public/                         # Static Assets & Icons
│   ├── src/
│   │   ├── components/                 # Reusable UI Components & Aerospace Portals
│   │   │   ├── smoa/                   # SMOA Aerospace UI Consoles
│   │   │   │   ├── ActivitySchedulePanel.tsx
│   │   │   │   ├── AttitudeViewer.tsx
│   │   │   │   ├── AutomatedRecoveryCard.tsx
│   │   │   │   ├── CommunicationPassCard.tsx
│   │   │   │   ├── ConstellationDashboard.jsx  # 3D Orbit Tracker & SOP Modal
│   │   │   │   ├── FaultInjectionPanel.tsx     # Seeding Anomaly Trigger
│   │   │   │   ├── HealthSummary.jsx
│   │   │   │   ├── HumanApprovalQueue.tsx      # Warden Safety Gate Interface
│   │   │   │   ├── MissionPlanner.tsx          # OR-Tools Schedule Viewer
│   │   │   │   ├── SeedingDashboard.tsx        # High-Freq Data Seeding Console
│   │   │   │   ├── SimulationPreviewModal.tsx  # Basilisk 30m Trajectory Modal
│   │   │   │   ├── TelemetryGrid.tsx           # 52-Parameter Live Gauges
│   │   │   │   ├── TopBar.tsx                  # Header Navigation & Portal Links
│   │   │   │   └── WardenGate.tsx
│   │   │   └── ui/                     # Radix / Tailwind Custom UI Components
│   │   ├── lib/                        # Client Utilities & API Clients
│   │   │   └── smoa/
│   │   │       ├── api.ts              # Robust API Client with Production Fallbacks
│   │   │       └── useTelemetry.ts     # Live 1Hz WebSocket Telemetry Hook
│   │   ├── routes/                     # TanStack File-Based Router Pages
│   │   │   ├── index.tsx               # Main Mission Operations Console (/)
│   │   │   ├── constellation.tsx       # 3D Orbit Tracker Pass (/constellation)
│   │   │   ├── planner.tsx             # AI Mission Planner Pass (/planner)
│   │   │   ├── replay.tsx              # Digital Twin Replay Pass (/replay)
│   │   │   └── seeding.tsx             # Data Seeding Controller Pass (/seeding)
│   │   └── constellation-main.tsx     # Standalone Constellation Tracker Mount
│   ├── package.json                    # Frontend Node Dependencies
│   ├── vercel.json                     # Vercel Production Routing & Build Config
│   └── vite.config.ts                  # Vite Build Configuration
│
├── simulator/                          # Standalone Basilisk Physics Simulator Package
│   ├── basilisk/                       # Basilisk Task Group & Orbital Kinematics
│   ├── faults/                         # 9 Subsystem Plugin Fault Modules
│   └── subsystems/                     # Coupled Power, Thermal, ADCS, Comms Models
│
├── deployment_guide.md                 # Complete Vercel + Render Deployment Manual
├── package.json                        # Root Project Scripts Manifest
├── README.md                           # Master Documentation & Evaluation Rubric Guide
├── setup.sh                            # One-Command Automated Environment Setup Script
├── start.sh                            # One-Command Unified System Launcher
├── start_all.py                        # Cross-Platform Python Process Manager
└── SUMMARY.md                          # Comprehensive Technical Architecture Report
```

---

## 🌐 Production Live Portals

| Portal / Service | Production Link | Description |
| :--- | :--- | :--- |
| 🌐 **Main Operations Console** | [https://code-rush2-0-404.vercel.app/](https://code-rush2-0-404.vercel.app/) | Primary spacecraft telemetry, ML sentinels, 3D attitude viewer & multi-agent consensus |
| 🛰️ **3D Constellation Tracker** | [https://code-rush2-0-404.vercel.app/constellation](https://code-rush2-0-404.vercel.app/constellation) | Real-time orbital mechanics, ground contact passes, and satellite constellation visualization |
| ⚡ **Data Seeding Controller** | [https://code-rush2-0-404.vercel.app/seeding](https://code-rush2-0-404.vercel.app/seeding) | Interactive fault injection and high-frequency telemetry dataset streaming controller |
| ⚙️ **FastAPI Backend API Docs** | [https://smoa-backend.onrender.com/docs](https://smoa-backend.onrender.com/docs) | Interactive Swagger UI API documentation and REST endpoints |
| 💓 **Health Check Endpoint** | [https://smoa-backend.onrender.com/health](https://smoa-backend.onrender.com/health) | System health & model status check endpoint |
| 📡 **WebSocket Telemetry Stream** | `wss://smoa-backend.onrender.com/ws/telemetry` | 1 Hz high-frequency 52-parameter real-time telemetry stream |

---

## 🚀 Key Newly Added Features & System Enhancements

### 1. Interactive Anomaly Diagnosis & Sensor SOP Inspection Modal
- **Location**: `Frontend/src/components/smoa/ConstellationDashboard.jsx`
- **Capability**: When an anomaly is detected or injected on `GSAT-201`, clicking on `GSAT-201` in the 3D globe, right-side node roster, or bottom status banner opens a dedicated **Aerospace Glassmorphism Modal**.
- **Inspected Attributes**:
  - 🚨 **Failure Diagnosis**: `EPS Battery Bus Voltage Droop (<21.0V) & Cell Balancer FET Latch-Up`.
  - 🛠️ **Recommended SOP Recovery Protocol**: Step-by-step guidance to isolate battery modules, shed non-essential payload load, initiate thermal conditioning, and authorize recovery.
  - 📊 **Required Sensor Telemetry Envelopes**: Live monitoring of EPS Bus Voltage, Battery SoC, Battery Temp, ADCS Pointing Error, Comms Signal, and Tank Pressure against safety thresholds.
  - 🛡️ **Interactive Action Buttons**: Directly resolve anomalies or route to Warden Safety Gate.

### 2. Unified 5-Page Navigation Header & Data Seeding Integration
- **Location**: `Frontend/src/components/smoa/TopBar.tsx` & `Frontend/src/routes/seeding.tsx`
- **Capability**: Integrated the `/seeding` Data Seeding Controller directly into the TanStack router navigation bar alongside Operations Console (`/`), Constellation Tracker (`/constellation`), AI Planner (`/planner`), and Incident Replay (`/replay`).

### 3. Dynamic Backend API Target Resolution (`getApiUrl`)
- **Location**: `Frontend/src/lib/smoa/api.ts` & `useTelemetry.ts`
- **Capability**: Features automatic environment detection. Resolves `VITE_API_URL` when provided, automatically defaults to `https://smoa-backend.onrender.com` in production (Vercel), and falls back to `http://localhost:8000` in local development environments.

### 4. Automated Testing & Health Check Suite for Hackathon Evaluators
- **Locations**: `Backend/server.py`, `Backend/tests/test_full_suite.py`, `setup.sh`, `start.sh`
- **Capability**: Added `/health` and `/api/health` endpoints returning live system metrics, database connectivity, and ML model status. Built a complete Pytest test suite covering health checks, OR-Tools activity schedules, Basilisk 30-minute predictive physics simulations, and self-healing algorithms.

---

## 🎯 Hackathon Evaluation Matrix Compliance (13-Criterion Rubric)

| Criterion | Code / Arch Standard | Implementation Evidence |
| :--- | :--- | :--- |
| **NAME (Naming & Style)** | CamelCase / Snake_case consistency | Strict PEP 8 in Python, ESLint & TypeScript types in React. Clean variable naming throughout. |
| **STRUCT (Structure)** | Modular directory organization | Single-responsibility directories: `/Backend` (routers, services, telemetry_ml, agentic), `/Frontend` (components, routes, lib). |
| **ERR (Error Handling)** | Resilient try/catch & fallbacks | Async exception traps on all REST/WS endpoints. Client degrades seamlessly to digital-twin physics simulator. |
| **LOG (Observability)** | Logging & Health endpoints | Langfuse tracing (`agentic/tracing.py`) + `/health` & `/api/health` returning 200 OK with system status. |
| **CFG (Config Management)** | Externalized configuration | Strict `.env` usage via `pydantic-settings` (`config.py`). Zero hardcoded credentials or API keys in source. |
| **DEPS (Dependencies)** | Explicit lockfiles & manifests | Standardized `Backend/requirements.txt`, `Frontend/package.json`, and `package-lock.json`. |
| **SETUP (Run Simplicity)** | Single-command launch | `setup.sh`, `start.sh`, `python start_all.py`, and `npm start` executable out-of-the-box. |
| **DOCS (Documentation)** | Comprehensive guide & specs | Full architectural diagrams, API routes, setup guides, and live portal links in `README.md`. |
| **TEST (Testing Discipline)** | Automated unit/integration tests | `pytest` test suite in `Backend/tests/` covering `/health`, `/planner/schedules`, Basilisk simulator, and self-healing algorithms. |
| **GIT (Git Hygiene)** | Clean history & structure | Meaningful commit history using Conventional Commits (`feat:`, `fix:`, `docs:`). |
| **FIT (Problem Fit)** | Real-world Aerospace relevance | Solves satellite telemetry overload & anomaly resolution with autonomous multi-agent copilot. |
| **INNOV (Innovation)** | Novel Multi-AI Architecture | Dual ML Sentinel (XGBoost + Isolation Forest) + Multi-LLM Agent Voting + 3D WebGL Digital Twin + Warden Gate. |
| **UX (Presentation & UX)** | State-of-the-art Aerospace UI | Glassmorphism dashboard, 3D spatial orbit visualization, and interactive anomaly inspection modal. |

---

## 📐 End-to-End Architecture Data Flow

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

## ⚡ Quickstart Execution Commands

### 1. Automated Setup & Dependency Installation
```bash
bash setup.sh
```

### 2. Execute Automated Unit Test Suite
```bash
npm test       # or cd Backend && pytest tests/
```

### 3. Unified All-in-One Service Launcher
```bash
python start_all.py   # or bash start.sh
```
