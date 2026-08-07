import logging
import hashlib
import time
from typing import Dict, Any
from agentic.graph.state import MissionGraphState

logger = logging.getLogger("SafetyAgent")

def run_safety_agent(state: MissionGraphState) -> MissionGraphState:
    """
    9. Safety & Security Agent:
    Performs security audits, cyber-threat inspection, prompt injection defense,
    prohibited command filtering, and security signature generation.
    Acts as the explicit security gatekeeper before the Warden Agent queues commands.
    """
    fd_output = state.get("flight_director_output", {})
    diagnosis = state.get("diagnosis_output", {})
    telemetry = state.get("telemetry_data", {})

    cmd = fd_output.get("primary_recommendation", "PWR_SHED_PAYLOAD_HEATER_BUS")
    root_cause = diagnosis.get("root_cause", "")

    # Security Prohibited Command Pattern Checklist
    prohibited_keywords = [
        "DEORBIT_IMMEDIATE",
        "OVERRIDE_SECURITY_KEY",
        "DISABLE_TELEMETRY_BEACON",
        "PURGE_MISSION_STORAGE",
        "UNAUTHORIZED_THRUSTER_BURNING"
    ]

    vulnerabilities = []
    security_status = "PASSED"
    threat_level = "NONE"

    # Check 1: Prohibited Command Inspection
    for kw in prohibited_keywords:
        if kw in cmd.upper() or kw in root_cause.upper():
            vulnerabilities.append(f"Security Alert: Prohibited operation keyword detected '{kw}'")
            security_status = "BLOCKED"
            threat_level = "CRITICAL"

    # Check 2: Prompt Injection / Command Manipulation Defense
    suspicious_chars = ["<script>", "exec(", "eval(", "rm -rf", "; DROP TABLE"]
    for sc in suspicious_chars:
        if sc in root_cause.lower():
            vulnerabilities.append(f"Security Alert: Suspicious code snippet or injection detected '{sc}'")
            security_status = "BLOCKED"
            threat_level = "HIGH"

    # Check 3: Cryptographic Security Hash Generation
    now_ms = int(time.time() * 1000)
    sig_payload = f"{cmd}:{security_status}:{now_ms}"
    security_signature = f"SEC-SIG-{hashlib.sha256(sig_payload.encode()).hexdigest()[:12].upper()}"

    safety_summary = {
        "security_status": security_status,
        "threat_level": threat_level,
        "vulnerabilities_detected": vulnerabilities,
        "security_signature": security_signature,
        "cyber_audit_timestamp": now_ms,
        "prompt_injection_defense": "CLEAN" if not vulnerabilities else "FLAGGED"
    }

    state["safety_output"] = safety_summary
    logger.info(f"[SafetyAgent] Security Audit: {security_status} | Threat: {threat_level} | Sig: {security_signature}")
    return state
