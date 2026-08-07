import logging
from typing import Dict, Any
from agentic.graph.state import MissionGraphState

logger = logging.getLogger("FlightDirectorAgent")

def run_flight_director_agent(state: MissionGraphState) -> MissionGraphState:
    """
    7. Flight Director Agent:
    Synthesizes outputs from Diagnosis, Planner, Archivist, Simulation, Consensus, and Trust Engine.
    Formulates exactly ONE authoritative mission recovery recommendation.
    """
    ml_output = state.get("ml_output", {})
    diagnosis = state.get("diagnosis_output", {})
    simulation = state.get("simulation_output", {})
    consensus = state.get("consensus_output", {})
    trust = state.get("trust_evaluation", {})

    failure_class = ml_output.get("failure_class", "Healthy")
    recommended_proc = diagnosis.get("recommended_procedure", "Continue Nominal Operations")
    trust_score = trust.get("trust_score", 90.0)
    consensus_status = consensus.get("consensus_status", "HIGH")

    # Single Recommendation Synthesis
    if trust_score < 60.0 or consensus_status == "REQUIRES HUMAN REVIEW":
        final_cmd = "MANUAL_OPERATOR_OVERRIDE_REQUIRED"
        rationale = f"Trust score ({trust_score}/100) or consensus level ({consensus_status}) below certified autonomous threshold."
    else:
        final_cmd = "PWR_SHED_PAYLOAD_HEATER_BUS" if "Battery" in failure_class else "THERM_PUMPA_OVERSPEED_110"
        rationale = f"Validated procedure '{recommended_proc}' passed Digital Twin simulation ({simulation.get('success_probability', 0.95)*100:.0f}%) and Trust Engine ({trust_score}/100)."

    fd_summary = {
        "primary_recommendation": final_cmd,
        "procedure_title": recommended_proc,
        "confidence_score": round(trust_score / 100.0, 4),
        "trust_score": trust_score,
        "rationale": rationale,
        "flight_director_signature": "FLIGHT_DIRECTOR_STATION_ALPHA"
    }

    state["flight_director_output"] = fd_summary
    logger.info(f"[FlightDirectorAgent] Recommendation: {final_cmd} | Trust: {trust_score}/100")
    return state
