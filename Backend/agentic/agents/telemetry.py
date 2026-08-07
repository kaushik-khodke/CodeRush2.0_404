import logging
from typing import Dict, Any
from agentic.graph.state import MissionGraphState

logger = logging.getLogger("TelemetryMonitorAgent")

def run_telemetry_monitor_agent(state: MissionGraphState) -> MissionGraphState:
    """
    1. Telemetry Monitor Agent:
    Ingests live telemetry frames, evaluates data quality, checks sensor integrity, and computes trends.
    """
    telemetry = state.get("telemetry_data", {})
    history = state.get("telemetry_history", [])

    total_parameters = len(telemetry)
    missing_sensors = [k for k, v in telemetry.items() if v is None]
    data_quality_score = 1.0 - (len(missing_sensors) / max(1, total_parameters))

    # Trend summary calculation across last 5 history frames
    voltage_trend = "STABLE"
    if len(history) >= 2:
        v_curr = telemetry.get("Battery_Voltage", 28.0)
        v_prev = history[-1].get("Battery_Voltage", 28.0)
        if v_curr < v_prev - 0.5:
            voltage_trend = "DROOPING"
        elif v_curr > v_prev + 0.5:
            voltage_trend = "RISING"

    monitor_summary = {
        "total_parameters_monitored": total_parameters,
        "data_quality_score": round(data_quality_score, 2),
        "missing_sensors": missing_sensors,
        "sensor_integrity": "NOMINAL" if not missing_sensors else "DEGRADED",
        "battery_voltage_trend": voltage_trend,
        "samples_in_history": len(history)
    }

    state["telemetry_monitor_output"] = monitor_summary
    logger.info(f"[TelemetryMonitorAgent] Monitored {total_parameters} params | Quality: {data_quality_score*100:.0f}%")
    return state
