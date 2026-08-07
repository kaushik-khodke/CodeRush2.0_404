# Spacecraft Telemetry Parameter Specification & ML Schema

Comprehensive reference of all **52 telemetry input parameters**, safety constraints, failure classification modes, regression targets, and Explainable AI (XAI) specifications implemented from `ml execution.pdf`.

---

## 1. Complete Telemetry Input Feature Vector ($X$)

| # | Parameter Name | Subsystem | Unit / Format | Nominal Range | Description |
| :-: | :--- | :--- | :---: | :---: | :--- |
| 1 | `Battery_Voltage` | Power | Volts ($V$) | $26.0 - 32.0\text{V}$ | Main spacecraft battery bus terminal voltage |
| 2 | `Battery_Current` | Power | Amperes ($A$) | $0.0 - 10.0\text{A}$ | Battery charge / discharge current |
| 3 | `Battery_SOC` | Power | Percentage ($\%$) | $30.0 - 100.0\%$ | Battery State of Charge (**Constraint > 30%**) |
| 4 | `Battery_Temperature` | Power | Celsius ($^\circ\text{C}$) | $10.0 - 45.0^\circ\text{C}$ | Battery cell health and thermal state |
| 5 | `Solar_Voltage` | Power | Volts ($V$) | $25.0 - 45.0\text{V}$ | Solar array output voltage |
| 6 | `Solar_Current` | Power | Amperes ($A$) | $2.0 - 25.0\text{A}$ | Solar array generated current |
| 7 | `Power_Load` | Power | Watts ($W$) | $100 - 400\text{W}$ | Total satellite electrical load power consumption |
| 8 | `Power_Generation` | Power | Watts ($W$) | $150 - 600\text{W}$ | Total generated power from solar panels |
| 9 | `Payload_Temperature` | Thermal | Celsius ($^\circ\text{C}$) | $15.0 - 50.0^\circ\text{C}$ | Primary scientific payload temperature |
| 10 | `CPU_Temperature` | Thermal | Celsius ($^\circ\text{C}$) | $20.0 - 70.0^\circ\text{C}$ | Onboard computer processor temp (**Constraint < 70°C**) |
| 11 | `Solar_Panel_Temperature` | Thermal | Celsius ($^\circ\text{C}$) | $-50.0 - 80.0^\circ\text{C}$ | Solar array panel surface temperature |
| 12 | `System_Temp` | Thermal | Celsius ($^\circ\text{C}$) | $15.0 - 50.0^\circ\text{C}$ | Spacecraft cabin / internal chassis temperature |
| 13 | `External_Temp` | Thermal | Celsius ($^\circ\text{C}$) | $-120.0 - 120.0^\circ\text{C}$ | External space environment thermal radiation |
| 14 | `Signal_Strength` | Communication | $\text{dBm}$ | $-105.0 - -50.0\text{dBm}$ | Received RF signal strength indicator (RSSI) |
| 15 | `Downlink_Rate` | Communication | $\text{Mbps}$ | $1.0 - 50.0\text{Mbps}$ | Telemetry downlink data transmission speed |
| 16 | `Uplink_Rate` | Communication | $\text{Mbps}$ | $0.1 - 5.0\text{Mbps}$ | Ground station command uplink speed |
| 17 | `Packet_Loss` | Communication | Percentage ($\%$) | $0.0 - 5.0\%$ | Telemetry packet loss rate |
| 18 | `Latency` | Communication | Milliseconds ($\text{ms}$) | $50 - 300\text{ms}$ | Ground station round-trip communication latency |
| 19 | `Communication_Window` | Communication | Binary ($0/1$) | $0 \text{ or } 1$ | Ground station line-of-sight visibility window |
| 20 | `Roll` | ADCS | Degrees ($\text{deg}$) | $-5.0^\circ - 5.0^\circ$ | Spacecraft roll attitude angle |
| 21 | `Pitch` | ADCS | Degrees ($\text{deg}$) | $-5.0^\circ - 5.0^\circ$ | Spacecraft pitch attitude angle |
| 22 | `Yaw` | ADCS | Degrees ($\text{deg}$) | $-5.0^\circ - 5.0^\circ$ | Spacecraft yaw attitude angle |
| 23 | `Angular_Velocity` | ADCS | $\text{deg/s}$ | $0.0 - 0.1\text{deg/s}$ | Rotational angular velocity speed |
| 24 | `Reaction_Wheel_Speed` | ADCS | $\text{RPM}$ | $1000 - 3000\text{RPM}$ | Flywheel speed of attitude reaction wheels |
| 25 | `Gyroscope_X` | ADCS | $\text{rad/s}$ | $-0.005 - 0.005\text{rad/s}$ | Gyroscope X-axis angular rate sensor |
| 26 | `Gyroscope_Y` | ADCS | $\text{rad/s}$ | $-0.005 - 0.005\text{rad/s}$ | Gyroscope Y-axis angular rate sensor |
| 27 | `Gyroscope_Z` | ADCS | $\text{rad/s}$ | $-0.005 - 0.005\text{rad/s}$ | Gyroscope Z-axis angular rate sensor |
| 28 | `Magnetometer` | ADCS | $\mu\text{T}$ | $30.0 - 60.0\mu\text{T}$ | Earth magnetic field sensor intensity |
| 29 | `Star_Tracker_Status` | ADCS | Binary ($0/1$) | $0 \text{ or } 1$ | Star tracker celestial lock status ($1=\text{Locked}$) |
| 30 | `Altitude` | Orbit | Kilometers ($\text{km}$) | $500 - 550\text{km}$ | Satellite orbital altitude above sea level |
| 31 | `Velocity` | Orbit | $\text{km/s}$ | $7.4 - 7.8\text{km/s}$ | Orbital velocity vector magnitude |
| 32 | `Latitude` | Orbit | Degrees ($\text{deg}$) | $-70.0^\circ - 70.0^\circ$ | Sub-satellite geodetic latitude |
| 33 | `Longitude` | Orbit | Degrees ($\text{deg}$) | $-180.0^\circ - 180.0^\circ$ | Sub-satellite geodetic longitude |
| 34 | `Orbital_Phase` | Orbit | Degrees ($\text{deg}$) | $0^\circ - 360^\circ$ | Current orbital position in revolution |
| 35 | `Eclipse_Status` | Orbit | Binary ($0/1$) | $0 \text{ or } 1$ | Orbital eclipse indicator ($1=\text{In Shadow}$) |
| 36 | `Fuel_Level` | Propulsion | Percentage ($\%$) | $10.0 - 100.0\%$ | Propellant fuel remaining (**Constraint > 10%**) |
| 37 | `Thruster_Temperature` | Propulsion | Celsius ($^\circ\text{C}$) | $20.0 - 60.0^\circ\text{C}$ | Thruster nozzle operational temperature |
| 38 | `Thruster_Status` | Propulsion | Binary ($0/1$) | $0 \text{ or } 1$ | Active thruster firing indicator ($1=\text{Active}$) |
| 39 | `Fuel_Pressure` | Propulsion | $\text{PSI}$ | $120 - 180\text{PSI}$ | Propellant tank pressure |
| 40 | `Burn_Duration` | Propulsion | Seconds ($\text{s}$) | $0 - 300\text{s}$ | Orbital maneuver burn duration |
| 41 | `Camera_Status` | Payload | Binary ($0/1$) | $0 \text{ or } 1$ | Optical imaging payload status ($1=\text{On}$) |
| 42 | `Instrument_Temperature` | Payload | Celsius ($^\circ\text{C}$) | $15.0 - 30.0^\circ\text{C}$ | Sensor instrument package temperature |
| 43 | `Instrument_Power` | Payload | Watts ($W$) | $50 - 120\text{W}$ | Scientific payload power consumption |
| 44 | `Data_Collection_Rate` | Payload | $\text{MB/s}$ | $5.0 - 20.0\text{MB/s}$ | Payload science data generation throughput |
| 45 | `Payload_Mode` | Payload | Categorical | $1, 2, \text{ or } 3$ | Operating mode ($1=\text{Standby}, 2=\text{Mapping}$) |
| 46 | `CPU_Usage` | Computer | Percentage ($\%$) | $0.0 - 90.0\%$ | Flight computer processor load (**Constraint < 90%**) |
| 47 | `RAM_Usage` | Computer | Percentage ($\%$) | $0.0 - 85.0\%$ | Flight computer RAM utilization |
| 48 | `Storage_Usage` | Computer | Percentage ($\%$) | $0.0 - 95.0\%$ | Onboard solid-state storage used (**Constraint < 95%**) |
| 49 | `Process_Health` | Computer | Binary ($0/1$) | $0 \text{ or } 1$ | Core flight software task status ($1=\text{Healthy}$) |
| 50 | `Software_Version` | Computer | Version ID | $2.1$ | Flight software release version |
| 51 | `Mission_Phase` | Mission | Categorical | $1, 2, \text{ or } 3$ | Operational phase ($1=\text{Orbit}, 2=\text{Observation}$) |
| 52 | `Observation_Window` | Mission | Binary ($0/1$) | $0 \text{ or } 1$ | Target observation opportunity status |

---

## 2. Safety Constraint Parameters (PDF Section 3)

The Explainable AI engine monitors the following critical safety boundaries:

- **Battery State of Charge**: `Battery_SOC > 30%`
- **CPU Temperature**: `CPU_Temperature < 70.0°C`
- **Propellant Fuel**: `Fuel_Level > 10%`
- **CPU Utilization**: `CPU_Usage < 90%`
- **Storage Availability**: `Storage_Usage < 95%`

---

## 3. Multiclass Failure Targets ($Y$) (PDF Section 6)

The XGBoost Classifier predicts the following 11 failure categories:

1. **`Healthy`**: All systems operating nominally.
2. **`Battery Failure`**: Severe voltage drop or current spike.
3. **`Solar Panel Failure`**: Solar generation collapse during sunlit orbital phase.
4. **`Communication Failure`**: Severe packet loss or signal strength degradation.
5. **`Thermal Anomaly`**: Excessive CPU or payload temperature overheating.
6. **`Power Anomaly`**: Load imbalance or power draw fault.
7. **`Sensor Failure`**: Star tracker loss or sensor drift.
8. **`Propulsion Failure`**: Thruster overheating or fuel pressure loss.
9. **`Attitude Control Failure`**: Reaction wheel speed saturation or tumbling.
10. **`Critical Failure`**: Multiple simultaneous subsystem faults.
11. **`Safe Mode Required`**: Multiple constraint violations requiring immediate safe mode entry.

---

## 4. Time-Series Regression Targets ($Y$) (PDF Section 6)

- **`Remaining_Battery_Life`**: Predicted remaining battery operational hours before depletion.
- **`Temperature_after_30min`**: Forecasted CPU processor temperature in 30 minutes.

---

## 5. How to Generate Dataset & Run Models

```powershell
# 1. Generate 52-parameter dataset
python generate_dataset.py

# 2. Train XGBoost Classifier & Isolation Forest
python train_mission_models.py

# 3. Evaluate full performance suite
python evaluate_all_metrics.py

# 4. Predict on sample telemetry row
python predict_mission.py --row 27
```
