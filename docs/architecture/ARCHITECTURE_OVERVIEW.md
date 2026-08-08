# System Architecture Overview — SMOA / ORION AI

## Executive Summary
**SMOA (Space Mission Operations Automator)** is an autonomous satellite operations platform designed to eliminate telemetry monitoring fatigue and accelerate critical orbital incident resolution.

## Component Decomposition

```mermaid
graph TD
    subgraph Data Generation & Simulation
        DT["Basilisk (BSK) Digital Twin Simulator Engine"]
        Sim["Local LEO Analytical Simulator"]
    end

    subgraph FastAPI Backend Layer
        WS["1Hz Telemetry WebSocket Broadcaster (/ws/telemetry)"]
        MLS["ML Sentinel (XGBoost + Isolation Forest)"]
        Context["Context Packaging & SHAP Feature Extractor"]
        LLMFactory["Multi-LLM Consensus Engine (Groq, Gemini, OpenAI, Ollama)"]
        TrustEngine["0-100 Composite Trust Metric Evaluator"]
        WardenGate["Warden Safety Gate (SHA-256 Signature Verification)"]
    end

    subgraph Data Storage
        SupaDB[("Supabase Cloud PostgreSQL (14 Schema Tables)")]
    end

    subgraph Frontend Aerospace Consoles
        Console["Operations Console (/)"]
        OrbitTracker["3D Constellation Orbit Tracker (/constellation)"]
        SeedingController["Data Seeding Controller (/seeding)"]
        Planner["AI Mission Planner (/planner)"]
        Replay["Incident Replay Console (/replay)"]
    end

    DT --> WS
    Sim --> WS
    WS --> SupaDB
    WS --> MLS
    MLS --> Context
    Context --> LLMFactory
    LLMFactory --> TrustEngine
    TrustEngine --> WardenGate
    WardenGate --> Console
    Console --> OrbitTracker
    Console --> SeedingController
    Console --> Planner
    Console --> Replay
```

## System Layers
1. **Telemetry Stream Layer**: 52 real-time parameters broadcast at 1Hz over WebSockets.
2. **ML Sentinel Anomaly Layer**: Dual-model system (XGBoost 5-Class Classifier + Isolation Forest continuous scorer).
3. **Multi-Agent Consensus Layer**: LangChain/LangGraph workflow coordinating parallel Groq, Gemini, OpenAI, and Ollama reasoning.
4. **Safety & Trust Gate**: Enforces physical parameter boundary checks and human-in-the-loop approval queues.
5. **Presentation Layer**: Responsive React 19 + Three.js aerospace glassmorphism interface.
