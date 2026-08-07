from typing import Dict, Any, List
from pydantic import BaseModel, Field

class TelemetryFrameSchema(BaseModel):
    timestamp: str
    met: int
    orbital_phase_deg: float
    eclipse_status: int
    altitude_km: float
    velocity_km_s: float
    roll_deg: float
    pitch_deg: float
    yaw_deg: float
    
    # Power Subsystem (Exact Feature Names)
    Battery_Voltage: float
    Battery_Current: float
    Battery_SOC: float
    Solar_Voltage: float
    Solar_Current: float
    Power_Load: float
    Power_Generation: float
    
    # Thermal Subsystem
    Payload_Temperature: float
    CPU_Temperature: float
    Solar_Panel_Temperature: float
    System_Temp: float
    External_Temp: float
    
    # Communication Subsystem
    Signal_Strength: float
    Downlink_Rate: float
    Uplink_Rate: float
    Packet_Loss: float
    Latency: float
    Communication_Window: int
    
    # Payload Subsystem
    Camera_Status: int
    Instrument_Temperature: float
    Instrument_Power: float
    Data_Collection_Rate: float
    Payload_Mode: int
    
    # Computer & Storage Subsystem
    CPU_Usage: float
    RAM_Usage: float
    Storage_Usage: float
    Process_Health: int
    Software_Version: float
    Storage_Buffer_Used_GB: float
    Storage_Capacity_GB: float
    
    # ADCS Subsystem
    Reaction_Wheel_Speed: float
    Gyroscope_X: float
    Gyroscope_Y: float
    Gyroscope_Z: float
    Magnetometer: float
    Star_Tracker_Status: int
    
    # Propulsion Subsystem
    Fuel_Level: float
    Thruster_Temperature: float
    Thruster_Status: int
    Fuel_Pressure: float
    Burn_Duration: float

    class Config:
        extra = "allow"
