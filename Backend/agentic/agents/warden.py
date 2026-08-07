from agentic.state import MissionGraphState
from agentic.schemas.warden_schema import WardenOutput

class WardenSafetyGateAgent:
    """
    Warden Agent:
    The final authoritative safety gateway.
    NEVER allows direct execution of commands on spacecraft systems.
    Evaluates safety constraints (Power, Thermal, Fuel, Comm) and routes approved actions to the Approval Queue.
    """
    def evaluate(self, state: MissionGraphState) -> MissionGraphState:
        telemetry = state.get("telemetry_data", {})
        fd = state.get("flight_director_output", {})

        soc = telemetry.get("Battery_SOC", 80.0)
        temp = telemetry.get("CPU_Temperature", 45.0)
        fuel = telemetry.get("Fuel_Level", 85.0)
        cpu_use = telemetry.get("CPU_Usage", 35.0)
        storage_use = telemetry.get("Storage_Usage", 55.0)

        checks = {
            "Battery_SOC_Above_30%": soc >= 30.0 or "BAT" in fd.get("recommended_procedure", ""),
            "CPU_Temp_Below_70C": temp <= 70.0 or "THERM" in fd.get("recommended_procedure", ""),
            "Fuel_Reserve_Above_10%": fuel >= 10.0 or "THR" in fd.get("recommended_procedure", ""),
            "CPU_Usage_Below_90%": cpu_use < 90.0,
            "Storage_Usage_Below_95%": storage_use < 95.0,
            "No_Direct_Autonomous_Execution": True
        }

        rejection_reasons = []
        for check_name, passed in checks.items():
            if not passed:
                rejection_reasons.append(f"Safety Constraint Violation: {check_name}")

        is_approved = len(rejection_reasons) == 0
        recommended_proc = fd.get("recommended_procedure", "SOP-BAT-01")

        output = WardenOutput(
            is_approved_for_queue=is_approved,
            constraint_checks=checks,
            rejection_reasons=rejection_reasons,
            queued_action=recommended_proc,
            safety_summary=f"Warden Safety Check {'PASSED' if is_approved else 'FAILED'}. Action '{recommended_proc}' queued for Human Operator Approval."
        )

        state["warden_output"] = output.model_dump()
        state["approval_status"] = "QUEUED_FOR_APPROVAL" if is_approved else "REJECTED_BY_WARDEN"
        return state

warden_agent = WardenSafetyGateAgent()

def run_warden_agent(state: MissionGraphState) -> MissionGraphState:
    return warden_agent.evaluate(state)
