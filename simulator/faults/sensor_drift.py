from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class SensorDriftFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Sensor Drift", subsystem="telemetry", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Battery_Voltage"] = telemetry.get("Battery_Voltage", 28.0) + (3.5 * self.magnitude)
            telemetry["Gyroscope_X"] = telemetry.get("Gyroscope_X", 0.001) + (0.05 * self.magnitude)
        return telemetry
