from typing import Dict, Any
from simulator.basilisk.core.mission import MissionDefinition
from simulator.telemetry.generator import TelemetryGenerator
from simulator.faults.battery_failure import BatteryFailureFault

class SafeModeDemoScenario:
    """
    Predefined Safe-Mode Emergency Contingency & AI Recovery Scenario.
    Triggers battery cell degradation and tests automated Safe Mode transition.
    """
    def __init__(self):
        self.mission = MissionDefinition(
            name="SMOA-SafeMode-Demo",
            altitude_km=520.0,
            inclination_deg=97.5,
            mass_kg=180.0
        )
        self.generator = TelemetryGenerator()
        self.fault = BatteryFailureFault(magnitude=1.2)
        self.generator.register_fault(self.fault)
        self.fault.activate()

    def get_goal(self) -> str:
        return "Simulate Battery Bus Voltage Droop & Test AI Agent Safe Mode Recovery Protocol"

    def step(self) -> Dict[str, Any]:
        return self.generator.generate_frame()
