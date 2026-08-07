class PropulsionSubsystem:
    """
    Models spacecraft propulsion: fuel level percentage, thruster temperature, fuel pressure, and burn duration.
    """
    def __init__(self, initial_fuel: float = 85.0):
        self.fuel_level = initial_fuel
        self.thruster_temp = 25.0
        self.thruster_status = 0
        self.fuel_pressure = 150.0
        self.burn_duration = 0.0

    def update(self, burn_active: bool = False, burn_time_sec: float = 0.0) -> dict:
        if burn_active:
            self.thruster_status = 1
            self.burn_duration += burn_time_sec
            self.fuel_level = max(0.0, self.fuel_level - (burn_time_sec * 0.05))
            self.thruster_temp = round(25.0 + burn_time_sec * 2.5, 2)
        else:
            self.thruster_status = 0
            self.thruster_temp = round(max(20.0, self.thruster_temp - 0.5), 2)

        return {
            "Fuel_Level": round(self.fuel_level, 2),
            "Thruster_Temperature": self.thruster_temp,
            "Thruster_Status": self.thruster_status,
            "Fuel_Pressure": self.fuel_pressure,
            "Burn_Duration": round(self.burn_duration, 2)
        }
