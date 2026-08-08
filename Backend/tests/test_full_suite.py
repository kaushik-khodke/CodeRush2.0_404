import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path for test resolution
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from server import app
from services.basilisk_simulator import basilisk_engine
from routers.seeding import create_anomaly_event_and_command
from agentic.tracing import log_agent_trace

client = TestClient(app)

def test_health_endpoint():
    """Verify system health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    assert "service" in data

def test_planner_schedules_endpoint():
    """Verify /api/planner/schedules returns dynamic schedules and enforces active queue constraints."""
    response = client.get("/api/planner/schedules")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Verify active tasks count does not exceed 9
    active_statuses = {"IN_PROGRESS", "SCHEDULED", "PENDING", "ACTIVE"}
    active_count = sum(1 for item in data if item.get("status") in active_statuses)
    assert active_count <= 9

def test_basilisk_digital_twin_simulator():
    """Verify Basilisk Digital Twin 30-minute predictive physics simulation."""
    res = basilisk_engine.simulate_command_preview("ADCS_AUTONOMOUS_MAGNETORQUER_DESAT", duration_minutes=30)
    assert res is not None
    assert res.get("isSafeToExecute") is True
    assert "predictedTrajectory" in res
    
    trajectory = res["predictedTrajectory"]
    assert len(trajectory) == 11
    
    first_step = trajectory[0]
    last_step = trajectory[-1]
    
    assert first_step["timeLabel"] == "T+00m"
    assert last_step["timeLabel"] == "T+30m"
    assert "roll" in first_step
    assert "pitch" in first_step
    assert "yaw" in first_step
    assert "wheelRpm" in first_step
    assert "pointingErrorDeg" in first_step

def test_autonomous_anomaly_modes():
    """Verify autonomous self-healing anomaly profiles return autoExecuted status."""
    autonomous_modes = ["reaction_wheel_desat", "ssr_buffer_flush", "payload_heater_cycle"]
    for mode in autonomous_modes:
        event, cmd = create_anomaly_event_and_command(mode)
        assert event is not None
        assert cmd is not None
        assert event.get("autoExecuted") is True
        assert cmd.get("autoExecuted") is True
        assert cmd.get("state") == "executed"

def test_langfuse_tracing_helper():
    """Verify Langfuse trace logging helper executes without errors."""
    try:
        log_agent_trace(
            trace_name="Pytest Suite Observability Check",
            agent_name="Test Runner Agent",
            prompt="Running unit test suite verification",
            output="Passed cleanly",
            metadata={"test": True}
        )
    except Exception as e:
        pytest.fail(f"log_agent_trace raised an exception: {e}")
