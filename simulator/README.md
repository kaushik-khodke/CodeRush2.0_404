# SMOA Spacecraft Digital Twin Simulator (Basilisk Physics Engine)

Production-grade, aerospace-inspired **Digital Twin Simulator Architecture** built for the **Space Mission Operations Automator (SMOA)** system.

---

## 🏛️ Aerospace System Architecture

```
                                  [ Basilisk Physics Engine ]
                                  (Orbit, Attitude, Sun Flux)
                                               │
                                               ▼
                              [ Custom Subsystems Architecture ]
                       ┌───────────────────────┼───────────────────────┐
                       │                       │                       │
               [ Power Subsystem ]     [ Thermal Subsystem ]    [ Communication ]
              (Battery SOC, Voltage)  (CPU / Payload Temp)    (Path Loss, Latency)
                       │                       │                       │
                       └───────────────────────┼───────────────────────┘
                                               │
                                               ▼
                                  [ Fault Injection Plugins ]
                              (Battery, Thermal, Comms, Wheels)
                                               │
                                               ▼
                                  [ Telemetry Generator ]
                              (Exact 52-Parameter Schema)
                                               │
                                               ▼
                                   [ Telemetry Bridge ]
                              (Isolated Async Sender)
                                               │
                                               ▼
                                  [ FastAPI Backend (8000) ]
                                               │
                                               ▼
                                  [ Supabase Realtime DB ]
                                               │
                                               ▼
                                    [ ML Sentinel Agent ]
                                 (XGBoost + Isolation Forest)
                                               │
                                               ▼
                                    [ Agentic AI Layer ]
                                 (LangGraph + Multi-LLM)
                                               │
                                               ▼
                                     [ Mission Control UI ]
```

---

## 🚀 Key Architectural Features

1. **Strict Subsystem Decoupling**:
   - The simulator knows **NOTHING** about FastAPI, Supabase, ML models, LangGraph, or Frontend components.
   - All external communication is cleanly encapsulated inside `simulator/bridge/telemetry_bridge.py`.

2. **Basilisk Physical Orbital Dynamics Core (`simulator/basilisk/core/`)**:
   - Propagates Keplerian orbits, J2 spherical harmonics, rigid-body quaternions ($\mathbf{q}$), angular velocity ($\mathbf{\omega}$), reaction wheel momentum, and orbital eclipse geometry.
   - Includes cross-platform fallback ensuring zero build errors across Linux, macOS, and Windows.

3. **Physically Coupled Subsystems (`simulator/subsystems/`)**:
   - **Power**: Solar charging $P_{gen}$ integrates eclipse shadow angles; battery SOC tracks subsystem loads.
   - **Thermal**: Nodal heat balance equations model radiative cooling vs CPU/Payload power dissipation.
   - **Communication**: Models Friis transmission path loss, signal strength (dBm), packet loss, and ground station pass windows (AOS/LOS).
   - **ADCS, Propulsion, Storage, Payload**: Models reaction wheel desaturation, thruster impulse mass flow, solid-state recorder buffer usage, and multispectral camera modes.

4. **Extensible Fault Injection Plugins (`simulator/faults/`)**:
   - Plugin architecture for runtime fault injection: `BatteryFailureFault`, `SolarPanelFailureFault`, `ThermalFault`, `PacketLossFault`, `SensorDriftFault`, `ReactionWheelFailureFault`, `CommunicationLossFault`, `ThrusterFailureFault`, and `MultipleSimultaneousFaults`.

5. **Predefined Mission Scenarios (`simulator/scenarios/`)**:
   - `EarthObservationScenario`: LEO 520km Sun-Sync orbit.
   - `MoonMapperScenario`: 100km Lunar polar mapping orbit.
   - `MarsOrbiterScenario`: Mars elliptical science orbit with DSN latency.
   - `SafeModeDemoScenario`: Safe Mode recovery contingency.

6. **Time-Series Replay Engine (`simulator/replay/`)**:
   - Snapshot recording buffer with `Play`, `Pause`, `Fast Forward`, and `Seek` controls.

---

## 🛠️ Usage Example

```python
import asyncio
from simulator.basilisk.core.simulation import BasiliskSimulationEngine
from simulator.telemetry.generator import TelemetryGenerator
from simulator.bridge.telemetry_bridge import TelemetryBridge
from simulator.faults.battery_failure import BatteryFailureFault

async def run_digital_twin():
    generator = TelemetryGenerator()
    bridge = TelemetryBridge()
    
    # Optionally inject a fault
    fault = BatteryFailureFault(magnitude=1.0)
    generator.register_fault(fault)
    fault.activate()
    
    for _ in range(10):
        frame = generator.generate_frame(step_sec=1.0)
        print(f"[MET {frame['met']}] SOC: {frame['Battery_SOC']}% | Temp: {frame['CPU_Temperature']}°C")
        await bridge.send_frame(frame)
        await asyncio.sleep(1.0)

asyncio.run(run_digital_twin())
```
