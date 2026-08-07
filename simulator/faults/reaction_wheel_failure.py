from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class ReactionWheelFailureFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Reaction Wheel Desaturation Failure", subsystem="adcs", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Reaction_Wheel_Speed"] = telemetry.get("Reaction_Wheel_Speed", 2800.0) + (2500.0 * self.magnitude)
            telemetry["Gyroscope_Z"] = telemetry.get("Gyroscope_Z", 0.001) + (0.12 * self.magnitude)
        return telemetry
