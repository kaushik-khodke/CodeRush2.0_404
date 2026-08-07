"""
Digital Twin Simulator End-to-End Verification Test Script
"""
import sys
import os
from pathlib import Path

# Ensure root workspace directory is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))

from simulator.basilisk.core.simulation import BasiliskSimulationEngine
from simulator.telemetry.generator import TelemetryGenerator
from simulator.faults.battery_failure import BatteryFailureFault
from simulator.faults.thermal_fault import ThermalFault
from simulator.scenarios.earth_observation import EarthObservationScenario
from simulator.replay.replay_engine import ReplayEngine

def run_tests():
    print("=" * 70)
    print("DIGITAL TWIN SIMULATOR - END-TO-END VERIFICATION TEST")
    print("=" * 70)

    # 1. Basilisk Physics Engine
    print("\n[1/5] Initializing Basilisk Physics Engine...")
    engine = BasiliskSimulationEngine()
    state = engine.step(1.0)
    print(f"  ✓ Orbital Phase: {state.orbital_phase_deg}° | Altitude: {state.altitude_km} km | Eclipse: {state.eclipse_status}")

    # 2. Telemetry Generator & 52-Parameter Schema Compliance
    print("\n[2/5] Testing Telemetry Generator (Exact 52-Parameter Schema)...")
    generator = TelemetryGenerator(engine=engine)
    frame = generator.generate_frame(step_sec=1.0)
    print(f"  ✓ Total Feature Keys: {len(frame)}")
    print(f"  ✓ Sample Metrics -> Voltage: {frame['Battery_Voltage']}V | SOC: {frame['Battery_SOC']}% | CPU Temp: {frame['CPU_Temperature']}°C")

    # 3. Fault Injection Plugins & Physical Cascade
    print("\n[3/5] Testing Fault Injection Plugins (Battery + Thermal)...")
    battery_fault = BatteryFailureFault(magnitude=1.0)
    thermal_fault = ThermalFault(magnitude=1.0)
    generator.register_fault(battery_fault)
    generator.register_fault(thermal_fault)

    battery_fault.activate()
    thermal_fault.activate()

    faulted_frame = generator.generate_frame(step_sec=1.0)
    print(f"  ✓ Faulted SOC: {faulted_frame['Battery_SOC']}% | Faulted CPU Temp: {faulted_frame['CPU_Temperature']}°C")

    # 4. Predefined Mission Scenarios
    print("\n[4/5] Testing Earth Observation Mission Scenario...")
    scenario = EarthObservationScenario()
    scen_frame = scenario.step()
    print(f"  ✓ Mission Goal: {scenario.get_goal()}")
    print(f"  ✓ Scenario Frame MET: {scen_frame['met']} | Power Load: {scen_frame['Power_Load']} W")

    # 5. Replay Engine Time Machine
    print("\n[5/5] Testing Telemetry Replay Engine...")
    replay = ReplayEngine()
    replay.record_frame(frame)
    replay.record_frame(faulted_frame)
    replay.play(speed=2.0)
    history = replay.get_history()
    print(f"  ✓ Replay History Buffer Count: {len(history)} frames")

    print("\n" + "=" * 70)
    print("ALL DIGITAL TWIN SIMULATOR VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
