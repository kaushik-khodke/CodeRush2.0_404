from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class SolarPanelFailureFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Solar Panel Failure", subsystem="power", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Power_Generation"] = max(0.0, telemetry.get("Power_Generation", 400.0) * (1.0 - 0.7 * self.magnitude))
            telemetry["Solar_Current"] = max(0.0, telemetry.get("Solar_Current", 12.0) * (1.0 - 0.7 * self.magnitude))
        return telemetry
