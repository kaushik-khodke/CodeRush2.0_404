import math

class PowerSubsystem:
    """
    Models spacecraft power generation, battery depth of discharge, bus voltage, and load.
    """
    def __init__(self, initial_soc: float = 78.4):
        self.soc = initial_soc
        self.bus_voltage = 27.6
        self.battery_current = 4.5
        self.solar_voltage = 35.0
        self.solar_current = 12.0
        self.power_load = 280.0
        self.power_generation = 412.0

    def update(self, eclipse: bool, met: int, power_drift_fault: float = 0.0) -> dict:
        wobble = lambda period, phase=0.0: math.sin((met / period) * math.pi * 2 + phase)
        
        # Integrate SOC: Discharges during eclipse, charges during sunlit phase
        if eclipse:
            self.soc -= 0.018
            self.power_generation = round(2.0 + wobble(37.0) * 1.2, 2)
            self.solar_voltage = 0.0
            self.solar_current = 0.0
            self.battery_current = -2.1
        else:
            self.soc += 0.024
            self.power_generation = round(412.0 + wobble(53.0) * 18.0, 2)
            self.solar_voltage = 35.0
            self.solar_current = 12.0
            self.battery_current = 4.5

        self.soc = min(99.4, max(10.0, self.soc))
        self.bus_voltage = round(27.6 + (self.soc - 78.0) * 0.045 + wobble(29.0) * 0.06 - power_drift_fault * 0.9, 2)
        
        return {
            "Battery_Voltage": self.bus_voltage,
            "Battery_Current": self.battery_current,
            "Battery_SOC": round(self.soc - power_drift_fault * 1.5, 2),
            "Solar_Voltage": self.solar_voltage,
            "Solar_Current": self.solar_current,
            "Power_Load": self.power_load,
            "Power_Generation": self.power_generation
        }
