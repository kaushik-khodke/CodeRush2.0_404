# REST & WebSocket API Specification — SMOA Engine

## System Endpoints Summary

### Health & Monitoring
- **`GET /`**: Returns system metadata, API documentation links, and version information.
- **`GET /health` / `GET /api/health`**: Comprehensive health check verifying database connection, ML model checkpoint status, and active telemetry source.

### Telemetry & Digital Twin State
- **`GET /api/telemetry/source`**: Returns active telemetry feed source (`"digital-twin"` vs `"simulator"`).
- **`POST /api/telemetry/source`**: Mutates active telemetry engine (`{"source": "digital-twin" | "simulator"}`).
- **`WS /ws/telemetry`**: 1 Hz live WebSocket stream pushing 52-parameter telemetry frames and real-time ML anomaly scores.

### Warden Safety Gate & Command Queue
- **`GET /api/commands/pending`**: Retrieves pending human approval items in the Warden Gate queue.
- **`POST /api/commands/:id/authorize`**: Executes operator decision (`{"decision": "approve" | "reject", "operatorNote": "..."}`).

### AI Mission Planner & Simulation
- **`GET /api/planner/schedules`**: Returns OR-Tools precedence-constrained activity schedules.
- **`POST /api/digital-twin/simulate`**: Executes 30-minute predictive Basilisk simulation forward in time.
