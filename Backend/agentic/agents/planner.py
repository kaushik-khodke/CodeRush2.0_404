from agentic.state import MissionGraphState
from agentic.schemas.planner_schema import MissionPlanOutput
from agentic.tools.ortools_planner import planner_tool

def run_planner_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Mission Planner Agent:
    Schedules mission tasks while satisfying power, thermal, battery, and comm window constraints.
    """
    telemetry = state.get("telemetry_data", {})
    comm_window = bool(telemetry.get("Communication_Window", 1))
    power_gen = float(telemetry.get("Power_Generation", 400.0))

    tasks = [
        {"name": "Telemetry Health Beacon Downlink", "subsystem": "Communication", "priority": 1, "power_req": 40.0, "duration_min": 10.0},
        {"name": "Primary Scientific Payload Mapping", "subsystem": "Payload", "priority": 2, "power_req": 85.0, "duration_min": 30.0},
        {"name": "Reaction Wheel De-saturation", "subsystem": "ADCS", "priority": 3, "power_req": 50.0, "duration_min": 15.0},
        {"name": "Onboard Flash Memory Garbage Collection", "subsystem": "Computer", "priority": 4, "power_req": 20.0, "duration_min": 20.0}
    ]

    result = planner_tool.solve_schedule(tasks=tasks, available_power_w=power_gen, comm_window_active=comm_window)

    output = MissionPlanOutput(
        schedule=result["schedule"],
        task_ordering=result["task_ordering"],
        resource_timeline=result["resource_timeline"],
        constraint_satisfaction=result["constraint_satisfaction"],
        summary=result["summary"]
    )

    state["planner_output"] = output.model_dump()
    state["mission_plan"] = output.model_dump()
    return state
