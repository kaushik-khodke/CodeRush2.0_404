import math
from simulator.utils.constants import SOLAR_CONSTANT

class EnvironmentSubsystem:
    """
    Models orbital solar flux, eclipse geometry, atmospheric density, and magnetic field.
    """
    def __init__(self):
        self.solar_flux = SOLAR_CONSTANT

    def update(self, eclipse: bool, orbital_phase_deg: float) -> dict:
        current_flux = 0.0 if eclipse else self.solar_flux
        return {
            "solar_flux_w_m2": current_flux,
            "eclipse_active": eclipse,
            "orbital_phase_deg": orbital_phase_deg
        }
