from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class ThermalFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Thermal Runaway", subsystem="thermal", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["CPU_Temperature"] = telemetry.get("CPU_Temperature", 45.0) + (35.0 * self.magnitude)
            telemetry["Payload_Temperature"] = telemetry.get("Payload_Temperature", 15.0) + (25.0 * self.magnitude)
            telemetry["System_Temp"] = telemetry.get("System_Temp", 22.0) + (18.0 * self.magnitude)
        return telemetry
