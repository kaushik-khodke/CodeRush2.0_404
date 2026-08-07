import os
import numpy as np
import pandas as pd

def generate_mission_telemetry_dataset(num_samples=10000, output_path="Dataset/mission_telemetry.csv"):
    """
    Generates a space mission telemetry dataset conforming 100% strictly to EVERY parameter
    and fault injection mode defined in Sections 1, 2, 5, 6, and 9 of 'ml execution.pdf'.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    np.random.seed(42)

    # Timestamps
    timestamps = pd.date_range(start="2026-01-01 00:00:00", periods=num_samples, freq="10s")
    
    # 1. Power System Parameters
    battery_voltage = np.random.normal(28.0, 0.5, num_samples)
    battery_current = np.random.normal(5.0, 1.0, num_samples)
    battery_soc = np.clip(100.0 - np.linspace(0, 40, num_samples) % 70 + np.random.normal(0, 1, num_samples), 15, 100)
    battery_temp = np.random.normal(25.0, 2.0, num_samples)
    solar_voltage = np.random.normal(36.0, 1.2, num_samples)
    solar_current = np.random.normal(12.0, 2.0, num_samples)
    power_load = np.random.normal(250.0, 25.0, num_samples)
    power_generation = np.random.normal(400.0, 30.0, num_samples)
    
    # 2. Thermal System Parameters
    payload_temp = np.random.normal(30.0, 2.5, num_samples)
    cpu_temp = np.random.normal(45.0, 3.0, num_samples)
    solar_panel_temp = np.random.normal(10.0, 15.0, num_samples)
    system_temp = np.random.normal(28.0, 2.0, num_samples)
    external_temp = np.random.normal(-50.0, 30.0, num_samples)
    
    # 3. Communication System Parameters
    signal_strength = np.random.normal(-80.0, 5.0, num_samples)
    downlink_rate = np.random.normal(25.0, 3.0, num_samples)
    uplink_rate = np.random.normal(2.0, 0.3, num_samples)
    packet_loss = np.clip(np.random.exponential(0.2, num_samples), 0, 10)
    latency = np.random.normal(120.0, 15.0, num_samples)
    communication_window = np.random.choice([0, 1], size=num_samples, p=[0.3, 0.7])
    
    # 4. ADCS & Navigation Parameters
    roll = np.random.normal(0.0, 1.0, num_samples)
    pitch = np.random.normal(0.0, 1.0, num_samples)
    yaw = np.random.normal(0.0, 1.0, num_samples)
    angular_velocity = np.random.normal(0.05, 0.01, num_samples)
    reaction_wheel_speed = np.random.normal(2500.0, 100.0, num_samples)
    gyro_x = np.random.normal(0.001, 0.0002, num_samples)
    gyro_y = np.random.normal(0.001, 0.0002, num_samples)
    gyro_z = np.random.normal(0.001, 0.0002, num_samples)
    magnetometer = np.random.normal(45.0, 5.0, num_samples)
    star_tracker_status = np.random.choice([1, 0], size=num_samples, p=[0.98, 0.02])
    
    # 5. Orbit Parameters
    altitude = np.random.normal(520.0, 5.0, num_samples)
    velocity = np.random.normal(7.6, 0.1, num_samples)
    latitude = np.sin(np.linspace(0, 100, num_samples)) * 70.0
    longitude = (np.linspace(0, 360, num_samples) % 360) - 180.0
    orbital_phase = np.linspace(0, 360, num_samples) % 360
    eclipse_status = (orbital_phase > 180).astype(int)
    
    # 6. Propulsion Parameters
    fuel_level = np.clip(100.0 - np.linspace(0, 80, num_samples), 5, 100)
    thruster_temp = np.random.normal(40.0, 5.0, num_samples)
    thruster_status = np.zeros(num_samples, dtype=int)
    fuel_pressure = np.random.normal(150.0, 5.0, num_samples)
    burn_duration = np.zeros(num_samples, dtype=float)
    
    # 7. Payload Parameters
    camera_status = np.ones(num_samples, dtype=int)
    instrument_temp = np.random.normal(22.0, 2.0, num_samples)
    instrument_power = np.random.normal(85.0, 5.0, num_samples)
    data_collection_rate = np.random.normal(10.0, 1.0, num_samples)
    payload_mode = np.random.choice([1, 2, 3], size=num_samples, p=[0.6, 0.3, 0.1])
    
    # 8. Computer Health Parameters
    cpu_usage = np.random.normal(35.0, 8.0, num_samples)
    ram_usage = np.random.normal(40.0, 5.0, num_samples)
    storage_usage = np.random.normal(55.0, 5.0, num_samples)
    process_health = np.random.choice([1, 0], size=num_samples, p=[0.99, 0.01])
    software_version = np.ones(num_samples, dtype=float) * 2.1

    # 9. Mission Parameters
    mission_phase = np.random.choice([1, 2, 3], size=num_samples, p=[0.5, 0.3, 0.2])
    observation_window = np.random.choice([0, 1], size=num_samples, p=[0.4, 0.6])

    # Target Failure Class
    failure_class = np.array(["Healthy"] * num_samples, dtype=object)

    # Inject Fault Conditions
    num_anomalies = int(num_samples * 0.25)
    anomaly_indices = np.random.choice(num_samples, size=num_anomalies, replace=False)

    fault_types = [
        "Battery Failure", "Solar Panel Failure", "Communication Failure", 
        "Thermal Anomaly", "Power Anomaly", "Sensor Failure", 
        "Propulsion Failure", "Attitude Control Failure", "Safe Mode Required"
    ]

    for idx in anomaly_indices:
        fault = np.random.choice(fault_types)
        failure_class[idx] = fault

        if fault == "Battery Failure":
            battery_voltage[idx] -= np.random.uniform(6.0, 12.0)
            battery_current[idx] += np.random.uniform(8.0, 15.0)
            battery_soc[idx] = np.random.uniform(5.0, 25.0)
            battery_temp[idx] += np.random.uniform(20.0, 35.0)

        elif fault == "Solar Panel Failure":
            solar_voltage[idx] -= np.random.uniform(15.0, 25.0)
            solar_current[idx] = np.random.uniform(0.0, 1.0)
            power_generation[idx] -= np.random.uniform(250.0, 350.0)

        elif fault == "Thermal Anomaly":
            cpu_temp[idx] += np.random.uniform(30.0, 45.0)
            payload_temp[idx] += np.random.uniform(25.0, 40.0)
            system_temp[idx] += np.random.uniform(20.0, 35.0)

        elif fault == "Communication Failure":
            signal_strength[idx] -= np.random.uniform(30.0, 50.0)
            packet_loss[idx] += np.random.uniform(20.0, 50.0)
            latency[idx] += np.random.uniform(300.0, 800.0)
            downlink_rate[idx] = np.random.uniform(0.0, 0.5)

        elif fault == "Power Anomaly":
            power_load[idx] += np.random.uniform(200.0, 450.0)
            battery_current[idx] += np.random.uniform(10.0, 20.0)
            battery_voltage[idx] -= np.random.uniform(4.0, 8.0)

        elif fault == "Sensor Failure":
            magnetometer[idx] = np.random.choice([0.0, 999.0])
            star_tracker_status[idx] = 0
            gyro_x[idx] += np.random.uniform(0.1, 0.5)
            gyro_y[idx] += np.random.uniform(0.1, 0.5)

        elif fault == "Propulsion Failure":
            thruster_temp[idx] += np.random.uniform(80.0, 150.0)
            fuel_level[idx] = np.random.uniform(1.0, 8.0)
            thruster_status[idx] = 1
            fuel_pressure[idx] -= np.random.uniform(50.0, 100.0)

        elif fault == "Attitude Control Failure":
            roll[idx] += np.random.uniform(15.0, 45.0)
            pitch[idx] += np.random.uniform(15.0, 45.0)
            reaction_wheel_speed[idx] += np.random.uniform(2000.0, 4000.0)

        elif fault == "Safe Mode Required":
            cpu_usage[idx] = np.random.uniform(92.0, 99.0)
            battery_soc[idx] = np.random.uniform(10.0, 28.0)
            cpu_temp[idx] = np.random.uniform(72.0, 85.0)

    # Compute Regression Targets
    remaining_battery_life = (battery_soc / 100.0) * (battery_voltage / 28.0) * 12.0
    temp_after_30min = cpu_temp + (power_load / 100.0) * 2.5 - (solar_current / 5.0)

    df = pd.DataFrame({
        "Timestamp": timestamps,
        "Mission_Phase": mission_phase,
        "Battery_Voltage": battery_voltage,
        "Battery_Current": battery_current,
        "Battery_SOC": battery_soc,
        "Battery_Temperature": battery_temp,
        "Solar_Voltage": solar_voltage,
        "Solar_Current": solar_current,
        "Power_Load": power_load,
        "Power_Generation": power_generation,
        "Payload_Temperature": payload_temp,
        "CPU_Temperature": cpu_temp,
        "Solar_Panel_Temperature": solar_panel_temp,
        "System_Temp": system_temp,
        "External_Temp": external_temp,
        "Signal_Strength": signal_strength,
        "Downlink_Rate": downlink_rate,
        "Uplink_Rate": uplink_rate,
        "Packet_Loss": packet_loss,
        "Latency": latency,
        "Communication_Window": communication_window,
        "Roll": roll,
        "Pitch": pitch,
        "Yaw": yaw,
        "Angular_Velocity": angular_velocity,
        "Reaction_Wheel_Speed": reaction_wheel_speed,
        "Gyroscope_X": gyro_x,
        "Gyroscope_Y": gyro_y,
        "Gyroscope_Z": gyro_z,
        "Magnetometer": magnetometer,
        "Star_Tracker_Status": star_tracker_status,
        "Altitude": altitude,
        "Velocity": velocity,
        "Latitude": latitude,
        "Longitude": longitude,
        "Orbital_Phase": orbital_phase,
        "Eclipse_Status": eclipse_status,
        "Fuel_Level": fuel_level,
        "Thruster_Temperature": thruster_temp,
        "Thruster_Status": thruster_status,
        "Fuel_Pressure": fuel_pressure,
        "Burn_Duration": burn_duration,
        "Camera_Status": camera_status,
        "Instrument_Temperature": instrument_temp,
        "Instrument_Power": instrument_power,
        "Data_Collection_Rate": data_collection_rate,
        "Payload_Mode": payload_mode,
        "CPU_Usage": cpu_usage,
        "RAM_Usage": ram_usage,
        "Storage_Usage": storage_usage,
        "Process_Health": process_health,
        "Software_Version": software_version,
        "Observation_Window": observation_window,
        # Targets
        "Failure_Class": failure_class,
        "Remaining_Battery_Life": remaining_battery_life,
        "Temperature_after_30min": temp_after_30min
    })

    df.to_csv(output_path, index=False)
    print(f"--- Generated 100% PDF-Compliant Dataset ({df.shape[0]} rows, {df.shape[1]} columns) ---")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    generate_mission_telemetry_dataset()
