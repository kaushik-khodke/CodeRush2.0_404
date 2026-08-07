from typing import Dict, Any

class MissionDefinition:
    """
    Defines mission parameters: orbit altitude, inclination, spacecraft mass, and sensor specs.
    """
    def __init__(
        self,
        name: str = "SMOA-Helios-1",
        altitude_km: float = 520.0,
        inclination_deg: float = 97.5,
        mass_kg: float = 180.0
    ):
        self.name = name
        self.altitude_km = altitude_km
        self.inclination_deg = inclination_deg
        self.mass_kg = mass_kg

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "altitude_km": self.altitude_km,
            "inclination_deg": self.inclination_deg,
            "mass_kg": self.mass_kg
        }
