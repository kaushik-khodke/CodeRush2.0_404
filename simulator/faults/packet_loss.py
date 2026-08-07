from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class PacketLossFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="High Packet Loss", subsystem="communication", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Packet_Loss"] = min(100.0, telemetry.get("Packet_Loss", 0.4) + (45.0 * self.magnitude))
            telemetry["Latency"] = telemetry.get("Latency", 420.0) + (1500.0 * self.magnitude)
        return telemetry
