import logging
from langgraph.graph import StateGraph, END
from agentic.graph.state import MissionGraphState

from agentic.agents.telemetry import run_telemetry_monitor_agent
from agentic.agents.ml_sentinel import run_ml_sentinel_agent
from agentic.agents.diagnosis import run_diagnosis_agent
from agentic.agents.archivist import run_archivist_agent
from agentic.agents.simulation import run_simulation_agent
from agentic.agents.planner import run_planner_agent
from agentic.agents.flight_director import run_flight_director_agent
from agentic.agents.safety import run_safety_agent
from agentic.agents.warden import run_warden_agent

logger = logging.getLogger("MissionGraph")

def is_anomaly_route(state: MissionGraphState) -> str:
    """
    Conditional Routing Function.
    If ML Sentinel detects an anomaly, routes to the Anomaly Agent Chain (Diagnosis -> Archivist -> Sim -> Planner -> FD -> Safety -> Warden).
    Otherwise, routes directly to END (Nominal Dashboard State).
    """
    if state.get("is_anomaly", False):
        logger.info("[MissionGraph] Anomaly detected by ML Sentinel. Routing to Multi-Agent Anomaly Recovery Chain.")
        return "diagnosis"
    
    logger.info("[MissionGraph] Nominal Telemetry. Routing directly to Dashboard End.")
    return END

# Build LangGraph StateGraph
builder = StateGraph(MissionGraphState)

# Add Agent Nodes
builder.add_node("telemetry_monitor", run_telemetry_monitor_agent)
builder.add_node("ml_sentinel", run_ml_sentinel_agent)
builder.add_node("diagnosis", run_diagnosis_agent)
builder.add_node("archivist", run_archivist_agent)
builder.add_node("simulation", run_simulation_agent)
builder.add_node("planner", run_planner_agent)
builder.add_node("flight_director", run_flight_director_agent)
builder.add_node("safety", run_safety_agent)
builder.add_node("warden", run_warden_agent)

# Set Entrypoint
builder.set_entry_point("telemetry_monitor")

# Edge 1: Telemetry Monitor -> ML Sentinel
builder.add_edge("telemetry_monitor", "ml_sentinel")

# Conditional Edge: ML Sentinel -> Anomaly?
builder.add_conditional_edges(
    "ml_sentinel",
    is_anomaly_route,
    {
        "diagnosis": "diagnosis",
        END: END
    }
)

# Anomaly Agent Recovery Chain with Security Safety Audit Layer
builder.add_edge("diagnosis", "archivist")
builder.add_edge("archivist", "simulation")
builder.add_edge("simulation", "planner")
builder.add_edge("planner", "flight_director")
builder.add_edge("flight_director", "safety")
builder.add_edge("safety", "warden")
builder.add_edge("warden", END)

# Compile Persistent Graph
mission_graph = builder.compile()
