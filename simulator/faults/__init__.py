from simulator.faults.base_fault import BaseFaultPlugin
from simulator.faults.battery_failure import BatteryFailureFault
from simulator.faults.solar_panel_failure import SolarPanelFailureFault
from simulator.faults.thermal_fault import ThermalFault
from simulator.faults.packet_loss import PacketLossFault
from simulator.faults.sensor_drift import SensorDriftFault
from simulator.faults.reaction_wheel_failure import ReactionWheelFailureFault
from simulator.faults.communication_loss import CommunicationLossFault
from simulator.faults.thruster_failure import ThrusterFailureFault
from simulator.faults.multiple_faults import MultipleSimultaneousFaults

__all__ = [
    "BaseFaultPlugin",
    "BatteryFailureFault",
    "SolarPanelFailureFault",
    "ThermalFault",
    "PacketLossFault",
    "SensorDriftFault",
    "ReactionWheelFailureFault",
    "CommunicationLossFault",
    "ThrusterFailureFault",
    "MultipleSimultaneousFaults"
]
