# ADR-001: Multi-Agent Architecture for Mission Control Reasoning

## Context
Spacecraft telemetry streams generate 52 parameters every second. Monitoring this volume manually causes operator fatigue. Simple rule engines fail to capture complex cascading thermal and power faults.

## Decision
We implemented a multi-agent system using LangGraph and LangChain. Telemetry is first analyzed by specialized ML models, packaged into structured context cards, and then reasoned over by 9 dedicated agent nodes:
1. TelemetryMonitorAgent
2. MLSentinelAgent
3. DiagnosisAgent
4. ArchivistAgent
5. SimulationAgent
6. PlannerAgent
7. FlightDirectorAgent
8. SafetyAgent
9. WardenAgent

## Alternatives Considered
- Single monolithic LLM prompt: Rejected due to hallucination risks, high latency, and lack of specialized domain boundaries.
- Hardcoded decision trees: Rejected due to inability to generalize to unexpected anomaly interactions.

## Consequences
- Clean separation of diagnostic responsibilities.
- Deterministic safety verification before any recovery command reaches the operator.
