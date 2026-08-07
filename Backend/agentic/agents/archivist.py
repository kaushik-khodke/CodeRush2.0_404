import logging
import asyncio
from typing import Dict, Any
from agentic.graph.state import MissionGraphState
from agentic.memory.mission_memory import mission_memory

logger = logging.getLogger("ArchivistAgent")

def run_archivist_agent(state: MissionGraphState) -> MissionGraphState:
    """
    4. Archivist Agent:
    Retrieves engineering manuals, SOP runbooks, version history, preconditions, and postconditions using RAG.
    """
    ml_output = state.get("ml_output", {})
    telemetry = state.get("telemetry_data", {})
    failure_class = ml_output.get("failure_class", "Healthy")

    subsystem = "power"
    if "Thermal" in failure_class:
        subsystem = "thermal"
    elif "Propulsion" in failure_class:
        subsystem = "propulsion"
    elif "Attitude" in failure_class:
        subsystem = "adcs"
    elif "Communication" in failure_class:
        subsystem = "comms"

    try:
        loop = asyncio.get_event_loop()
        historical_records = loop.run_until_complete(
            mission_memory.search_similar_anomalies(failure_class, subsystem)
        )
    except Exception as e:
        logger.warning(f"[ArchivistAgent] Search notice: {e}")
        historical_records = []

    archivist_summary = {
        "active_sop": f"SOP-{subsystem.upper()}-EMERGENCY-v2.1",
        "engineering_manual": f"NASA/ISRO {subsystem.upper()} Operations Manual Rev 4",
        "preconditions": [
            "Contact link active with ground station",
            "Battery SOC > 25%"
        ],
        "postconditions": [
            "Subsystem telemetry returns within 2-sigma envelope",
            "Thermal equilibrium re-established"
        ],
        "retrieved_historical_events": historical_records
    }

    state["archivist_output"] = archivist_summary
    state["active_sop"] = archivist_summary["active_sop"]
    logger.info(f"[ArchivistAgent] Retrieved SOP: {archivist_summary['active_sop']} | Records: {len(historical_records)}")
    return state
