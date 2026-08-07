from langgraph.graph import StateGraph, END
from agentic.state import MissionGraphState

from agentic.agents.telemetry import run_telemetry_monitor_agent
from agentic.agents.ml_sentinel import run_ml_sentinel_agent
from agentic.agents.planner import run_planner_agent
from agentic.agents.diagnosis import run_diagnosis_agent
from agentic.agents.archivist import run_archivist_agent
from agentic.agents.simulation import run_simulation_agent
from agentic.agents.continuation import run_continuation_agent
from agentic.agents.flight_director import run_flight_director_agent
from agentic.agents.warden import run_warden_agent

def is_anomaly_route(state: MissionGraphState) -> str:
    """
    Conditional routing function.
    If ML Sentinel detects an anomaly, routes state to Diagnosis Agent.
    Otherwise routes directly to END (Nominal Dashboard State).
    """
    if state.get("is_anomaly", False):
        return "diagnosis"
    return END

# Build LangGraph StateGraph
builder = StateGraph(MissionGraphState)

# Add Nodes
builder.add_node("telemetry_monitor", run_telemetry_monitor_agent)
builder.add_node("ml_sentinel", run_ml_sentinel_agent)
builder.add_node("planner", run_planner_agent)
builder.add_node("diagnosis", run_diagnosis_agent)
builder.add_node("archivist", run_archivist_agent)
builder.add_node("simulation", run_simulation_agent)
builder.add_node("continuation", run_continuation_agent)
builder.add_node("flight_director", run_flight_director_agent)
builder.add_node("warden", run_warden_agent)

# Set Entrypoint
builder.set_entry_point("telemetry_monitor")

# Linear Edges
builder.add_edge("telemetry_monitor", "ml_sentinel")
builder.add_edge("ml_sentinel", "planner")

# Conditional Edge
builder.add_conditional_edges(
    "planner",
    is_anomaly_route,
    {
        "diagnosis": "diagnosis",
        END: END
    }
)

# Anomaly Agent Chain
builder.add_edge("diagnosis", "archivist")
builder.add_edge("archivist", "simulation")
builder.add_edge("simulation", "continuation")
builder.add_edge("continuation", "flight_director")
builder.add_edge("flight_director", "warden")
builder.add_edge("warden", END)

# Compile Persistent Graph
mission_graph = builder.compile()
