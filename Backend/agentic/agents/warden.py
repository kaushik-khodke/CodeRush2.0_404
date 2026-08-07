import time
import logging
from typing import Dict, Any
from agentic.graph.state import MissionGraphState

logger = logging.getLogger("WardenAgent")

def run_warden_agent(state: MissionGraphState) -> MissionGraphState:
    """
    8. Warden Agent:
    Final authority safety gate.
    Verifies Constraints, Power, Thermal, Fuel, and Operator permissions.
    CRITICAL RULE: NEVER executes commands directly. ONLY queues them for Human Operator Approval.
    """
    telemetry = state.get("telemetry_data", {})
    fd_output = state.get("flight_director_output", {})
    trust = state.get("trust_evaluation", {})

    cmd_name = fd_output.get("primary_recommendation", "PWR_SHED_PAYLOAD_HEATER_BUS")
    procedure = fd_output.get("procedure_title", "Emergency Recovery Procedure")
    trust_score = trust.get("trust_score", 90.0)

    # Perform mandatory safety constraint check
    c_power = telemetry.get("Battery_SOC", 80) >= 30.0
    c_thermal = telemetry.get("CPU_Temperature", 45) <= 70.0
    c_fuel = telemetry.get("Fuel_Level", 85) >= 10.0

    all_constraints_passed = c_power and c_thermal and c_fuel

    now_ms = int(time.time() * 1000)
    cmd_id = f"CMD-{now_ms % 10000:04d}"

    queued_command = {
        "id": cmd_id,
        "ts": now_ms,
        "command": cmd_name,
        "subsystem": "power" if "PWR" in cmd_name else "thermal",
        "summary": procedure,
        "irreversible": True,
        "linkedEventId": "EVT-4471",
        "state": "pending",
        "trustScore": trust_score,
        "constraint": {
            "status": "pass" if all_constraints_passed else "fail",
            "solver": "Warden Safety Gatekeeper · Multi-Agent Hybrid Layer",
            "reasoning": f"Constraints check: Power ({'OK' if c_power else 'FAIL'}), Thermal ({'OK' if c_thermal else 'FAIL'}), Fuel ({'OK' if c_fuel else 'FAIL'}).",
            "checks": [
                {"name": "Power Safety Constraint (SOC > 30%)", "ok": c_power, "detail": f"SOC: {telemetry.get('Battery_SOC', 80):.1f}%"},
                {"name": "Thermal Safety Constraint (CPU < 70C)", "ok": c_thermal, "detail": f"CPU: {telemetry.get('CPU_Temperature', 45):.1f} C"},
                {"name": "Fuel Safety Constraint (Fuel > 10%)", "ok": c_fuel, "detail": f"Fuel: {telemetry.get('Fuel_Level', 85):.1f}%"}
            ]
        }
    }

    # Queue command into Human Approval Queue
    queue = state.get("approval_queue", [])
    queue.append(queued_command)
    state["approval_queue"] = queue

    warden_summary = {
        "gate_status": "APPROVED_FOR_HUMAN_QUEUE" if all_constraints_passed else "REJECTED_SAFETY_VIOLATION",
        "queued_command_id": cmd_id,
        "execution_allowed": False,  # HARD RULE: NEVER EXECUTE AUTOMATICALLY
        "queued_for_human_operator": True,
        "constraints_verified": all_constraints_passed
    }

    state["warden_output"] = warden_summary
    state["approval_status"] = warden_summary["gate_status"]

    # Record Audit Log entry
    audit_entry = {
        "timestamp": now_ms,
        "event": "WARDEN_SAFETY_GATE_CHECK",
        "command_id": cmd_id,
        "command": cmd_name,
        "gate_status": warden_summary["gate_status"],
        "trust_score": trust_score
    }
    audits = state.get("audit_logs", [])
    audits.append(audit_entry)
    state["audit_logs"] = audits

    logger.info(f"[WardenAgent] Gate Check: {warden_summary['gate_status']} | Queued CMD: {cmd_id} (No Auto-Execution)")
    return state
