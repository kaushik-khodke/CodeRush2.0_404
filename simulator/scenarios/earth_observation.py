from typing import Dict, Any
from simulator.basilisk.core.mission import MissionDefinition
from simulator.telemetry.generator import TelemetryGenerator

class EarthObservationScenario:
    """
    Predefined LEO 520km Sun-Synchronous Earth Observation Scenario.
    Goal: High-resolution multispectral imagery & Ka-band ground station downlinks.
    """
    def __init__(self):
        self.mission = MissionDefinition(
            name="SMOA-EarthObs-1",
            altitude_km=520.0,
            inclination_deg=97.5,
            mass_kg=180.0
        )
        self.generator = TelemetryGenerator()

    def get_goal(self) -> str:
        return "Continuous 520km Sun-Synchronous Earth Multispectral Mapping & Svalbard Ka-band Downlinks"

    def step(self) -> Dict[str, Any]:
        return self.generator.generate_frame()
