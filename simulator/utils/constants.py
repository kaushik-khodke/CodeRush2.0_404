"""
Aerospace Physical Constants & System Parameters
"""
import math

# Planetary & Orbital Constants
EARTH_RADIUS_KM = 6371.0
EARTH_MU = 398600.4418  # Standard gravitational parameter (km^3 / s^2)
J2_PERTIURBATION = 1.08262668e-3  # Earth J2 zonal harmonic
SPEED_OF_LIGHT = 299792458.0  # m / s
SOLAR_CONSTANT = 1361.0  # W / m^2 at 1 AU

# Orbital Mechanics
LEO_ALTITUDE_DEFAULT_KM = 520.0
ORBITAL_PERIOD_LEO_SEC = 2 * math.pi * math.sqrt((EARTH_RADIUS_KM + LEO_ALTITUDE_DEFAULT_KM)**3 / EARTH_MU)

# Subsystem Nominal Limits
NOMINAL_BATTERY_CAPACITY_AH = 40.0
NOMINAL_BUS_VOLTAGE_V = 28.0
NOMINAL_SOLAR_AREA_M2 = 2.5
NOMINAL_SOLAR_EFFICIENCY = 0.28
NOMINAL_CP_THERMAL_MASS = 1200.0  # J / K thermal inertia
NOMINAL_EMISSIVITY = 0.85
NOMINAL_STEFAN_BOLTZMANN = 5.670374419e-8
