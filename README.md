# CodeRush 2.0 | Team Project Repository

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)

---

## 📌 Project Information

- **Team Name**: Team 404
- **Project Title**: **ORION AI — Spacecraft Mission Control & Autonomous Operations (SMOA)**
- **Track / Theme**: Autonomous Spacecraft Systems / Aerospace Machine Learning & Multi-Agent AI

---

## 🔗 Live Deployment & Production Portals

The complete system is live in production across **Vercel** (Frontend Apps) and **Render** (Backend API & Telemetry WebSockets):

| Portal / Service | Production Link | Description |
| :--- | :--- | :--- |
| 🌐 **Main Operations Console** | [https://code-rush2-0-404.vercel.app/](https://code-rush2-0-404.vercel.app/) | Primary spacecraft telemetry, ML sentinels, 3D attitude viewer & multi-agent consensus |
| 🛰️ **3D Constellation Tracker** | [https://code-rush2-0-404.vercel.app/constellation](https://code-rush2-0-404.vercel.app/constellation) | Real-time orbital mechanics, ground contact passes, and satellite constellation visualization |
| ⚡ **Data Seeding Controller** | [https://code-rush2-0-404.vercel.app/seeding](https://code-rush2-0-404.vercel.app/seeding) | Interactive fault injection and high-frequency telemetry dataset streaming controller |
| ⚙️ **FastAPI Backend API Docs** | [https://smoa-backend.onrender.com/docs](https://smoa-backend.onrender.com/docs) | Interactive Swagger UI API documentation and REST endpoints |
| 📡 **WebSocket Telemetry Stream** | `wss://smoa-backend.onrender.com/ws/telemetry` | 1 Hz high-frequency 52-parameter real-time telemetry stream |

---

## 💡 Project Description

**ORION AI (Spacecraft Mission Operations Automator)** is an aerospace-grade **Autonomous Satellite Mission Control & Multi-Agent AI System**. It monitors high-frequency 52-parameter satellite telemetry streams, performs real-time machine learning anomaly detection, executes parallel multi-LLM diagnostic reasoning, evaluates physical constraint trust metrics, runs high-fidelity 3D Digital Twin physics simulations, and enforces strict human-in-the-loop command safety gates.

### 🌟 Key Technical Innovations

1. **Dual ML Sentinel Engine**: Uses an **XGBoost 5-class failure classifier** alongside an **Isolation Forest anomaly detector** for real-time risk scoring ($1\text{ Hz}$). LLMs are strictly prohibited from raw classification—ML provides objective ground truth.
2. **Multi-LLM Multi-Agent Consensus**: Orchestrates parallel agent reasoning using **Groq, Gemini, OpenAI, and Ollama** via LangGraph to cross-validate diagnostic hypotheses and prevent hallucination in critical mission decisions.
3. **3D Orbit & Attitude Digital Twin**: Full 3D WebGL (Three.js / React Three Fiber) spatial visualization of satellite body rates, quaternions, orbital elements, ground station contact passes, and solar vectors.
4. **Human-in-the-Loop Warden Gate**: Enforces cryptographic signatures (SHA-256) and approval queues for high-risk autonomous recovery procedures before hardware command execution.

---

## 🛠️ Technical Stack

### **Frontend Infrastructure**
- **Core Framework**: React 19, TypeScript 5.8, Vite
- **Styling & Components**: Vanilla CSS + TailwindCSS v4, Radix UI Primitives, Lucide Icons, Framer Motion
- **3D Visualization**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Routing & State**: TanStack Router, TanStack React Query

### **Backend Infrastructure**
- **Framework**: Python 3.11+, FastAPI, Uvicorn, Async Pydantic v2
- **Database & Persistence**: Supabase Cloud PostgreSQL (14 Schema Tables, CDC Realtime WebSockets), Async SQLAlchemy, SQLite Fallback (`mission_control.db`)
- **Machine Learning & Math**: PyTorch, Scikit-Learn, XGBoost, NumPy, Pandas, Google OR-Tools
- **Agentic AI & Observability**: LangGraph, LangChain, LangChain-Groq, Langfuse Tracing

---

## 📐 End-to-End System Architecture

```mermaid
graph TD
    subgraph Data Sources
        Sim["Basilisk Digital Twin / Simulator"]
        Seed["Data Seeding Controller"]
    end

    subgraph Backend Engine ["FastAPI Backend & ML Pipeline"]
        Bridge["Telemetry Stream (1Hz Websockets)"]
        ML["ML Sentinel (XGBoost + Isolation Forest)"]
        Context["Context Packaging Engine"]
        MultiAgent["Multi-LLM Agent Consensus (Groq / Gemini)"]
        Trust["Trust & Safety Warden (SHA-256 Gate)"]
    end

    subgraph Persistence
        SupaDB[("Supabase PostgreSQL DB")]
    end

    subgraph Frontend Portals ["Vercel Single-Page Frontend"]
        OpsConsole["Operations Console (/)"]
        Constellation["3D Constellation Tracker (/constellation)"]
        SeedingUI["Data Seeding Controller (/seeding)"]
    end

    Sim --> Bridge
    Seed --> Bridge
    Bridge --> SupaDB
    Bridge --> ML
    ML --> Context
    Context --> MultiAgent
    MultiAgent --> Trust
    Trust --> OpsConsole
    OpsConsole --> Constellation
    OpsConsole --> SeedingUI
```

---

## 📦 Project Directory Structure

```text
CodeRush2.0_404/
├── Backend/                    # FastAPI Server & Machine Learning Core
│   ├── agentic/                # LangGraph Multi-Agent Consensus Engine
│   ├── checkpoints/            # Trained PyTorch & XGBoost ML Models (.pkl, .pth)
│   ├── database/               # SQLAlchemy Models & Supabase Client
│   ├── routers/                # FastAPI Endpoints (Telemetry, Seeding, Predict, Mission)
│   ├── telemetry_ml/           # Anomaly Detection & Explainable AI (SHAP)
│   ├── server.py               # Main FastAPI Application & WebSockets (/ws/telemetry)
│   ├── requirements.txt        # Python Dependencies
│   └── render.yaml             # Render Blueprint Configuration
├── Frontend/                   # React 19 + TypeScript + Three.js App
│   ├── src/
│   │   ├── components/         # Reusable UI & 3D Twin Components
│   │   ├── lib/smoa/           # Telemetry Hooks, WebSockets, API Services
│   │   ├── routes/             # TanStack Router Pages (index, constellation, seeding, planner, replay)
│   │   └── constellation-main.tsx
│   ├── index.html              # Main Console Entry Point
│   ├── constellation.html      # 3D Constellation Tracker Entry Point
│   ├── seeding.html            # Data Seeding Entry Point
│   ├── vercel.json             # Vercel Production SPA Rewrite Rules
│   └── package.json            # Node Dependencies & Scripts
├── simulator/                  # Digital Twin Telemetry & Orbit Generators
├── start_all.py                # Unified Local Development Orchestrator
└── README.md                   # Project Documentation
```

---

## ⚡ Setup and Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CodeRush2.0_404.git
cd CodeRush2.0_404
```

### 2. Configure Environment Variables

Create `Backend/.env`:
```ini
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/postgres
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
HOST=0.0.0.0
PORT=8000
```

Create `Frontend/.env`:
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/telemetry
```

### 3. Run Locally (Unified Launcher)
You can launch all services (Backend + Main Console + Constellation Tracker + Seeding App) with a single command:

```bash
# Using Python Unified Launcher
python start_all.py
```
This automatically boots:
- ⚙️ **FastAPI Backend & WebSockets**: `http://localhost:8000`
- 🌐 **Main Mission Console**: `http://localhost:5173`
- ⚡ **Data Seeding Controller**: `http://localhost:5174`
- 🛰️ **3D Constellation Tracker**: `http://localhost:5175`

---

