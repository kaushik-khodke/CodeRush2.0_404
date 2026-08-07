from typing import Dict, Any
from simulator.basilisk.core.mission import MissionDefinition
from simulator.telemetry.generator import TelemetryGenerator

class MoonMapperScenario:
    """
    Predefined Lunar Polar 100km Mapping Scenario.
    Goal: Mare Imbrium & South Pole Shackleton Crater water ice survey.
    """
    def __init__(self):
        self.mission = MissionDefinition(
            name="SMOA-LunarMapper-2",
            altitude_km=100.0,
            inclination_deg=90.0,
            mass_kg=220.0
        )
        self.generator = TelemetryGenerator()

    def get_goal(self) -> str:
        return "100km Lunar Polar Orbit Survey of Mare Imbrium & Shackleton Crater"

    def step(self) -> Dict[str, Any]:
        frame = self.generator.generate_frame()
        frame["altitude_km"] = 100.0
        frame["velocity_km_s"] = 1.63
        return frame
