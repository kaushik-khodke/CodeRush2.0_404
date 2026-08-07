from agentic.state import MissionGraphState
from agentic.tools.supabase_memory_tool import memory_tool

async def run_memory_manager_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Mission Memory Manager:
    Persists decision trajectory, agent outputs, and warden resolution status into Supabase.
    """
    ml_output = state.get("ml_output", {})
    fd_output = state.get("flight_director_output", {})
    warden_output = state.get("warden_output", {})

    failure_class = ml_output.get("failure_class", "Healthy")
    session_id = f"SESSION_{telemetry_timestamp(state)}"

    key_outcomes = {
        "failure_class": failure_class,
        "confidence": ml_output.get("confidence", 0.9),
        "recommended_procedure": fd_output.get("recommended_procedure", "None"),
        "warden_approval": warden_output.get("is_approved_for_queue", False),
        "flight_director_summary": fd_output.get("summary", "")
    }

    try:
        await memory_tool.log_memory(
            session_id=session_id,
            event_type=failure_class,
            key_outcomes=key_outcomes
        )
    except Exception as e:
        print(f"[Memory Agent Warning] Could not persist memory log: {e}")

    return state

def telemetry_timestamp(state: MissionGraphState) -> str:
    telemetry = state.get("telemetry_data", {})
    return str(telemetry.get("timestamp", "NOW")).replace(":", "").replace(" ", "_")
