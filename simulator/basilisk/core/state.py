import math
from typing import Dict, Any, Tuple

class SpacecraftState:
    """
    Holds rigid-body dynamics state: position (r), velocity (v), attitude quaternion (q),
    angular velocity (w), and eclipse status.
    """
    def __init__(self):
        self.r_km: Tuple[float, float, float] = (6891.0, 0.0, 0.0)
        self.v_km_s: Tuple[float, float, float] = (0.0, 7.61, 1.2)
        self.attitude_q: Tuple[float, float, float, float] = (1.0, 0.0, 0.0, 0.0)
        self.angular_velocity_rad_s: Tuple[float, float, float] = (0.001, 0.001, 0.001)
        self.roll_deg: float = 0.0
        self.pitch_deg: float = 0.0
        self.yaw_deg: float = 0.0
        self.orbital_phase_deg: float = 0.0
        self.eclipse_status: int = 0  # 0 = Sunlit, 1 = Eclipse
        self.altitude_km: float = 520.0
        self.velocity_magnitude_km_s: float = 7.61

    def to_dict(self) -> Dict[str, Any]:
        return {
            "altitude_km": self.altitude_km,
            "velocity_km_s": self.velocity_magnitude_km_s,
            "roll_deg": self.roll_deg,
            "pitch_deg": self.pitch_deg,
            "yaw_deg": self.yaw_deg,
            "angular_velocity": math.sqrt(sum(w**2 for w in self.angular_velocity_rad_s)),
            "orbital_phase_deg": self.orbital_phase_deg,
            "eclipse_status": self.eclipse_status
        }
