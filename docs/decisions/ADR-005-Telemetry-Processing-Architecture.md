# ADR-005: High-Frequency Telemetry Ingestion & ML Feature Pipeline

## Context
Spacecraft stream 52 heterogeneous sensor parameters across power, thermal, ADCS, comms, and orbital subsystems.

## Decision
We implemented a two-stage ML Sentinel pipeline:
1. **Unsupervised Stream Baseline (Isolation Forest)**: Continuously evaluates standard deviation and distribution drift across all 52 features.
2. **Supervised Fault Classifier (XGBoost)**: Maps anomalous frames into 5 certified failure classes (Healthy, Voltage Droop, Thermal Overheat, Comms Attenuation, ADCS Oscillation).
3. **Feature Engineering**: Standardizes parameters, computes rolling 5-second moving averages, and calculates thermal derivative rates ($dT/dt$).

## Consequences
- Sub-millisecond inference speed suitable for 1Hz live telemetry streams.
- SHAP feature attributions directly identify root-cause sensors for operator inspection.
