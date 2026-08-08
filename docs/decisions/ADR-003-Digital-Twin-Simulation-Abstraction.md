# ADR-003: Digital Twin / Simulation Abstraction & Runtime State Switching

## Context
High-reliability spacecraft mission control requires forward predictive physics simulation to test recovery actions before command execution. The UI and mission control backend must support both fast analytical simulation and high-fidelity 6-DOF Basilisk astrodynamics simulation without coupling mission logic to a single physics engine.

## Decision
We created a decoupled `BasiliskAstrodynamicsEngine` interface and integrated backend telemetry source state switching via `POST /api/telemetry/source`. Switching between `Simulator` and `Digital Twin` mutates the active backend telemetry generation engine, altering 6-DOF Keplerian orbital coordinates, quaternion attitude, and thermal equilibrium values in real time.

## Consequences
- The mission control platform can swap underlying orbital propagators seamlessly.
- UI toggling triggers genuine backend runtime state changes rather than static visual label swaps.
