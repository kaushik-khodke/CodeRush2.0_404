import time
from typing import Dict, Any, List
from simulator.basilisk.core.simulation import BasiliskSimulationEngine
from simulator.subsystems.power import PowerSubsystem
from simulator.subsystems.thermal import ThermalSubsystem
from simulator.subsystems.communication import CommunicationSubsystem
from simulator.subsystems.payload import PayloadSubsystem
from simulator.subsystems.computer import ComputerSubsystem
from simulator.subsystems.storage import StorageSubsystem
from simulator.subsystems.adcs import ADCSSubsystem
from simulator.subsystems.propulsion import PropulsionSubsystem
from simulator.subsystems.environment import EnvironmentSubsystem
from simulator.faults.base_fault import BaseFaultPlugin

class TelemetryGenerator:
    """
    Assembles Basilisk dynamics, subsystem physics models, and active fault injection plugins
    into standardized 52-parameter JSON telemetry frames.
    """
    def __init__(self, engine: BasiliskSimulationEngine = None):
        self.engine = engine or BasiliskSimulationEngine()
        self.power = PowerSubsystem()
        self.thermal = ThermalSubsystem()
        self.comms = CommunicationSubsystem()
        self.payload = PayloadSubsystem()
        self.computer = ComputerSubsystem()
        self.storage = StorageSubsystem()
        self.adcs = ADCSSubsystem()
        self.propulsion = PropulsionSubsystem()
        self.env = EnvironmentSubsystem()
        self.faults: List[BaseFaultPlugin] = []

    def register_fault(self, fault: BaseFaultPlugin):
        self.faults.append(fault)

    def generate_frame(self, step_sec: float = 1.0) -> Dict[str, Any]:
        state = self.engine.step(step_sec)
        met = self.engine.clock.get_met()
        eclipse = state.eclipse_status == 1

        # Calculate Subsystem Physics States
        power_data = self.power.update(eclipse, met)
        thermal_data = self.thermal.update(eclipse, met, power_data["Power_Load"])
        comms_data = self.comms.update(met, state.orbital_phase_deg)
        payload_data = self.payload.update(eclipse, thermal_data["Payload_Temperature"])
        computer_data = self.computer.update()
        storage_data = self.storage.update(payload_data["Data_Collection_Rate"], comms_data["Downlink_Rate"], step_sec)
        adcs_data = self.adcs.update(met)
        prop_data = self.propulsion.update()

        # Consolidate frame dictionary
        frame = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "met": met,
            "orbital_phase_deg": state.orbital_phase_deg,
            "eclipse_status": state.eclipse_status,
            "altitude_km": state.altitude_km,
            "velocity_km_s": state.velocity_magnitude_km_s,
            "roll_deg": state.roll_deg,
            "pitch_deg": state.pitch_deg,
            "yaw_deg": state.yaw_deg,
            **power_data,
            **thermal_data,
            **comms_data,
            **payload_data,
            **computer_data,
            **storage_data,
            **adcs_data,
            **prop_data
        }

        # Apply active fault injection plugins
        for fault in self.faults:
            if fault.active:
                frame = fault.apply(frame)

        return frame
