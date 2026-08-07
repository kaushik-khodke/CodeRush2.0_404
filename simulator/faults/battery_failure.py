from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class BatteryFailureFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Battery Failure", subsystem="power", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Battery_SOC"] = max(5.0, telemetry.get("Battery_SOC", 80.0) - (15.0 * self.magnitude))
            telemetry["Battery_Voltage"] = max(18.0, telemetry.get("Battery_Voltage", 28.0) - (8.0 * self.magnitude))
            telemetry["Battery_Temperature"] = telemetry.get("Battery_Temperature", 20.0) + (25.0 * self.magnitude)
        return telemetry
