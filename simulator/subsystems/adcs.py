import math

class ADCSSubsystem:
    """
    Models Attitude Determination & Control System: reaction wheel speed, gyroscopes, magnetometer, and star tracker status.
    """
    def __init__(self):
        self.wheel_rpm = 2840.0
        self.gyro_x = 0.001
        self.gyro_y = 0.001
        self.gyro_z = 0.001
        self.magnetometer = 45.0
        self.star_tracker_status = 1

    def update(self, met: int, adcs_hw_fault: float = 0.0) -> dict:
        wobble = lambda period, phase=0.0: math.sin((met / period) * math.pi * 2 + phase)
        self.wheel_rpm = round(2840.0 + wobble(89.0) * 210.0 + adcs_hw_fault * 900.0, 2)
        return {
            "Reaction_Wheel_Speed": self.wheel_rpm,
            "Gyroscope_X": self.gyro_x,
            "Gyroscope_Y": self.gyro_y,
            "Gyroscope_Z": self.gyro_z,
            "Magnetometer": self.magnetometer,
            "Star_Tracker_Status": self.star_tracker_status
        }
