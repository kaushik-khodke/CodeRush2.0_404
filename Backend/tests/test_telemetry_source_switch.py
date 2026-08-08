import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from server import app, state

client = TestClient(app)

def test_telemetry_source_get_and_post():
    """Verify GET and POST /api/telemetry/source endpoints."""
    res_get = client.get("/api/telemetry/source")
    assert res_get.status_code == 200
    data = res_get.json()
    assert "source" in data
    assert "available" in data

    # Switch source to 'digital-twin'
    res_post_dt = client.post("/api/telemetry/source", json={"source": "digital-twin"})
    assert res_post_dt.status_code == 200
    assert res_post_dt.json()["source"] == "digital-twin"
    assert state.source == "digital-twin"

    # Switch source to 'simulator'
    res_post_sim = client.post("/api/telemetry/source", json={"source": "simulator"})
    assert res_post_sim.status_code == 200
    assert res_post_sim.json()["source"] == "simulator"
    assert state.source == "simulator"

def test_invalid_telemetry_source():
    """Verify invalid source payload returns 400 Bad Request."""
    res = client.post("/api/telemetry/source", json={"source": "invalid_engine"})
    assert res.status_code == 400
