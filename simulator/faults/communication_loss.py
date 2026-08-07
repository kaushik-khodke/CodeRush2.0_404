from typing import Dict, Any
from simulator.faults.base_fault import BaseFaultPlugin

class CommunicationLossFault(BaseFaultPlugin):
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Communication Loss", subsystem="communication", magnitude=magnitude)

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            telemetry["Signal_Strength"] = -135.0
            telemetry["Downlink_Rate"] = 0.0
            telemetry["Uplink_Rate"] = 0.0
            telemetry["Packet_Loss"] = 100.0
            telemetry["Communication_Window"] = 0
        return telemetry
