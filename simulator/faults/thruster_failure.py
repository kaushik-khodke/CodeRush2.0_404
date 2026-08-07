from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class ThrusterFailureFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Thruster Latch Valve Failure", subsystem="propulsion", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Thruster_Status"] = 1
            telemetry["Thruster_Temperature"] = telemetry.get("Thruster_Temperature", 25.0) + (110.0 * self.magnitude)
            telemetry["Fuel_Pressure"] = max(20.0, telemetry.get("Fuel_Pressure", 150.0) - (60.0 * self.magnitude))
        return telemetry
