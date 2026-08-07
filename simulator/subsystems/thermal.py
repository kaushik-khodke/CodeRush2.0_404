import math

class ThermalSubsystem:
    """
    Models nodal thermal balance across CPU, payload, battery, system, and radiator.
    """
    def __init__(self):
        self.cpu_temp = 45.0
        self.battery_temp = 18.2
        self.payload_temp = -6.4
        self.system_temp = 22.0
        self.external_temp = -50.0
        self.solar_panel_temp = 25.0

    def update(self, eclipse: bool, met: int, power_load: float, thermal_hw_fault: float = 0.0) -> dict:
        wobble = lambda period, phase=0.0: math.sin((met / period) * math.pi * 2 + phase)

        self.battery_temp = round(18.2 + wobble(211.0) * 2.4 + (-3.1 if eclipse else 1.4) + thermal_hw_fault * 9.0, 2)
        self.payload_temp = round(-6.4 + wobble(167.0, 1.1) * 3.2 + (-5.2 if eclipse else 2.6), 2)
        self.solar_panel_temp = round(25.0 if not eclipse else -60.0, 2)
        self.cpu_temp = round(45.0 + (power_load - 280.0) * 0.05 + thermal_hw_fault * 15.0, 2)
        self.system_temp = round(22.0 + wobble(311.0) * 1.5, 2)
        self.external_temp = round(-50.0 if not eclipse else -120.0, 2)

        return {
            "Payload_Temperature": self.payload_temp,
            "CPU_Temperature": self.cpu_temp,
            "Solar_Panel_Temperature": self.solar_panel_temp,
            "System_Temp": self.system_temp,
            "External_Temp": self.external_temp
        }
