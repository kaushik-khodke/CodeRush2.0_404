from typing import Dict, Any, List
from simulator.faults.base_fault import BaseFaultPlugin
from simulator.faults.battery_failure import BatteryFailureFault
from simulator.faults.thermal_fault import ThermalFault
from simulator.faults.packet_loss import PacketLossFault

class MultipleSimultaneousFaults(BaseFaultPlugin):
    """
    Simultaneous multi-subsystem cascade fault injector (Battery + Thermal + Comms).
    """
    def __init__(self, magnitude: float = 1.0):
        super().__init__(name="Multiple Cascading Faults", subsystem="system", magnitude=magnitude)
        self.sub_faults: List[BaseFaultPlugin] = [
            BatteryFailureFault(magnitude=magnitude),
            ThermalFault(magnitude=magnitude),
            PacketLossFault(magnitude=magnitude)
        ]

    def activate(self, magnitude: float = None):
        self.active = True
        for sf in self.sub_faults:
            sf.activate(magnitude or self.magnitude)

    def deactivate(self):
        self.active = False
        for sf in self.sub_faults:
            sf.deactivate()

    def apply(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        if self.active:
            for sf in self.sub_faults:
                telemetry = sf.apply(telemetry)
        return telemetry
