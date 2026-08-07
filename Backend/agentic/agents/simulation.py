from agentic.state import MissionGraphState
from agentic.schemas.simulation_schema import SimulationOutput
from agentic.tools.digital_twin_simulator import simulator_tool

def run_simulation_agent(state: MissionGraphState) -> MissionGraphState:
    """
    Future Simulation Agent:
    Executes Digital Twin simulation to forecast physical consequences of executing candidate SOP.
    NO actual spacecraft commands are executed here.
    """
    telemetry = state.get("telemetry_data", {})
    archivist = state.get("archivist_output", {})

    top_sop = archivist.get("top_recommended_sop", "SOP-BAT-01")

    sim_res = simulator_tool.simulate_procedure(current_telemetry=telemetry, procedure_code=top_sop)

    output = SimulationOutput(
        expected_outcome=sim_res["expected_outcome"],
        battery_impact_percent=sim_res["battery_impact_percent"],
        fuel_impact_percent=sim_res["fuel_impact_percent"],
        temperature_trend_deg_c=sim_res["temperature_trend_deg_c"],
        mission_delay_minutes=sim_res["mission_delay_minutes"],
        success_probability=sim_res["success_probability"],
        simulation_notes=sim_res["simulation_notes"]
    )

    state["simulation_output"] = output.model_dump()
    return state
