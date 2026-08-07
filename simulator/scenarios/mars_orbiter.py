from typing import Dict, Any
from simulator.basilisk.core.mission import MissionDefinition
from simulator.telemetry.generator import TelemetryGenerator

class MarsOrbiterScenario:
    """
    Predefined Mars Elliptical Science Orbit Scenario.
    Goal: Atmospheric methane detection & DSN communication passes.
    """
    def __init__(self):
        self.mission = MissionDefinition(
            name="SMOA-MarsExpress-3",
            altitude_km=350.0,
            inclination_deg=86.3,
            mass_kg=450.0
        )
        self.generator = TelemetryGenerator()

    def get_goal(self) -> str:
        return "Mars Atmospheric Methane Plume Spectrometry & Deep Space Network Passes"

    def step(self) -> Dict[str, Any]:
        frame = self.generator.generate_frame()
        frame["altitude_km"] = 350.0
        frame["velocity_km_s"] = 3.42
        frame["Latency"] = 840000.0  # 14 minute light travel time delay
        return frame
