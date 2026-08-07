from typing import Dict, Any

class DigitalTwinSimulatorTool:
    """
    Digital Twin Simulation Engine.
    Simulates expected physical outcomes of Standard Operating Procedures (SOPs)
    without executing any actual spacecraft commands.
    """
    def simulate_procedure(self, current_telemetry: Dict[str, Any], procedure_code: str) -> Dict[str, Any]:
        battery_soc = current_telemetry.get("Battery_SOC", 80.0)
        cpu_temp = current_telemetry.get("CPU_Temperature", 45.0)
        fuel_level = current_telemetry.get("Fuel_Level", 75.0)

        if "BAT" in procedure_code or "Safe Mode" in procedure_code:
            expected_outcome = "Non-essential load shed. Battery recovery rate +3.5%/hr."
            battery_impact = +12.5
            fuel_impact = 0.0
            temp_trend = -8.2
            delay_min = 30.0
            prob = 0.96
        elif "THR" in procedure_code or "Thruster" in procedure_code:
            expected_outcome = "Thruster feed line isolated. Burn aborted cleanly."
            battery_impact = -1.2
            fuel_impact = -0.5
            temp_trend = -15.0
            delay_min = 45.0
            prob = 0.98
        elif "THERM" in procedure_code or "Cooling" in procedure_code:
            expected_outcome = "Auxiliary thermal loops activated. CPU cooling -12 deg C."
            battery_impact = -4.5
            fuel_impact = 0.0
            temp_trend = -12.0
            delay_min = 10.0
            prob = 0.94
        else:
            expected_outcome = "Nominal procedure execution. Telemetry parameters stabilized."
            battery_impact = 0.0
            fuel_impact = 0.0
            temp_trend = -1.0
            delay_min = 0.0
            prob = 0.99

        return {
            "expected_outcome": expected_outcome,
            "battery_impact_percent": battery_impact,
            "fuel_impact_percent": fuel_impact,
            "temperature_trend_deg_c": temp_trend,
            "mission_delay_minutes": delay_min,
            "success_probability": prob,
            "simulation_notes": f"Digital Twin simulation run for {procedure_code}. Initial SOC: {battery_soc:.1f}%, Temp: {cpu_temp:.1f}C."
        }

simulator_tool = DigitalTwinSimulatorTool()
