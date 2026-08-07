/**
 * Orbital Propagator for ORION AI Digital Twin
 * 
 * Implements two-body Keplerian motion with J2 perturbations.
 * 
 * References:
 * - Vallado, D. A., "Fundamentals of Astrodynamics and Applications", Microcosm Press.
 * - Montenbruck, O., & Gill, E., "Satellite Orbits: Models, Methods and Applications", Springer.
 */

import { rk4Step } from "./rk4";

// Constants (Standard WGS-84 / Astrodynamics baselines)
export const MU = 3.986004415e14; // Earth gravitational parameter (m^3/s^2)
export const RE = 6371000;         // Earth equatorial radius (m) (approx standard, as requested)
export const J2 = 1.08262617e-3;   // Earth J2 zonal harmonic coefficient

export interface KeplerianElements {
  a: number;   // Semi-major axis (meters)
  e: number;   // Eccentricity (dimensionless, 0 <= e < 1)
  i: number;   // Inclination (degrees)
  raan: number;// Right Ascension of the Ascending Node (degrees)
  argPer: number; // Argument of Perigee (degrees)
  meanAnomaly: number; // Mean Anomaly at epoch (degrees)
}

// Plausible default orbital parameters for the ARGUS-7 spacecraft (LEO slightly eccentric/inclined)
export const ARGUS7_ELEMENTS: KeplerianElements = {
  a: 7100000,       // 7,100 km semi-major axis (~729 km altitude)
  e: 0.045,         // Slightly eccentric orbit for visual dynamic variation
  i: 51.64,         // Inclined orbit similar to ISS
  raan: 45.0,       // RAAN
  argPer: 90.0,     // Argument of perigee
  meanAnomaly: 0.0, // Start at perigee
};

// Convert degrees to radians
const degToRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Analytical Kepler Propagator
 * Solves Kepler's Equation for Mean Anomaly -> Eccentric Anomaly -> True Anomaly
 * and returns ECI Position and Velocity vectors.
 */
export function keplerToECI(elements: KeplerianElements, t: number): {
  position: [number, number, number];
  velocity: [number, number, number];
} {
  const { a, e, i: incDeg, raan: raanDeg, argPer: argPerDeg, meanAnomaly: M0Deg } = elements;

  const i = degToRad(incDeg);
  const raan = degToRad(raanDeg);
  const argPer = degToRad(argPerDeg);
  const M0 = degToRad(M0Deg);

  // Mean motion
  const n = Math.sqrt(MU / Math.pow(a, 3));
  
  // Mean anomaly at time t
  const M = (M0 + n * t) % (2 * Math.PI);

  // Solve Kepler's Equation: E - e*sin(E) = M using Newton-Raphson
  let E = M;
  const maxIterations = 100;
  const tolerance = 1e-9;
  for (let k = 0; k < maxIterations; k++) {
    const f = E - e * Math.sin(E) - M;
    const df = 1 - e * Math.cos(E);
    const dE = f / df;
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }

  // True Anomaly (nu)
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Distance from center
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane (PQW frame)
  const x_pqw = r * Math.cos(nu);
  const y_pqw = r * Math.sin(nu);

  // Velocity in orbital plane
  const p = a * (1 - e * e); // Semi-latus rectum
  const v_factor = Math.sqrt(MU / p);
  const vx_pqw = -v_factor * Math.sin(nu);
  const vy_pqw = v_factor * (e + Math.cos(nu));

  // Rotations from PQW plane to ECI frame
  const cosR = Math.cos(raan);
  const sinR = Math.sin(raan);
  const cosW = Math.cos(argPer);
  const sinW = Math.sin(argPer);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  // Transform matrix terms
  const r11 = cosR * cosW - sinR * sinW * cosI;
  const r12 = -cosR * sinW - sinR * cosW * cosI;
  const r21 = sinR * cosW + cosR * sinW * cosI;
  const r22 = -sinR * sinW + cosR * cosW * cosI;
  const r31 = sinW * sinI;
  const r32 = cosW * sinI;

  // Cartesian ECI Position
  const x = x_pqw * r11 + y_pqw * r12;
  const y = x_pqw * r21 + y_pqw * r22;
  const z = x_pqw * r31 + y_pqw * r32;

  // Cartesian ECI Velocity
  const vx = vx_pqw * r11 + vy_pqw * r12;
  const vy = vx_pqw * r21 + vy_pqw * r22;
  const vz = vx_pqw * r31 + vy_pqw * r32;

  return {
    position: [x, y, z],
    velocity: [vx, vy, vz]
  };
}

/**
 * State Derivative Function including J2 Geopotential perturbations
 * State format: [x, y, z, vx, vy, vz]
 */
export function orbitDerivatives(state: number[]): number[] {
  const [x, y, z, vx, vy, vz] = state;

  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(r2);
  const r3 = r2 * r;
  const r5 = r2 * r2 * r;

  // 1. Two-body point mass acceleration
  const ax_2b = -MU * x / r3;
  const ay_2b = -MU * y / r3;
  const az_2b = -MU * z / r3;

  // 2. J2 Perturbation term
  const z2_over_r2 = (z * z) / r2;
  
  // K coefficient factor: -1.5 * J2 * mu * Re^2 / r^5
  const K = -1.5 * J2 * MU * (RE * RE) / r5;

  const ax_J2 = K * (1 - 5 * z2_over_r2) * x;
  const ay_J2 = K * (1 - 5 * z2_over_r2) * y;
  const az_J2 = K * (3 - 5 * z2_over_r2) * z;

  return [
    vx,
    vy,
    vz,
    ax_2b + ax_J2,
    ay_2b + ay_J2,
    az_2b + az_J2
  ];
}

// Global simulation time state to prevent rebuilding trajectory from t=0 every frame
let currentSimT = 0;
let currentSimState: number[] = [];

/**
 * Numerical Propagator wrapper for Three.js animations.
 * Integrates state forward in real-time with J2 perturbations using RK4.
 * Returns ECI position scaled to Three.js units (where Earth Radius = 1.5 units).
 */
export function getPositionAtTime(elapsedSeconds: number): [number, number, number] {
  // Initialize state at t=0
  if (currentSimState.length === 0 || elapsedSeconds < currentSimT) {
    const { position, velocity } = keplerToECI(ARGUS7_ELEMENTS, 0);
    currentSimState = [...position, ...velocity];
    currentSimT = 0;
  }

  // Integrate forward in steps to keep CPU usage low
  const stepSize = 10; // 10-second steps for stable integration
  
  while (currentSimT + stepSize <= elapsedSeconds) {
    currentSimState = rk4Step(currentSimState, stepSize, orbitDerivatives);
    currentSimT += stepSize;
  }

  // Fractional step remaining
  if (currentSimT < elapsedSeconds) {
    const dt = elapsedSeconds - currentSimT;
    currentSimState = rk4Step(currentSimState, dt, orbitDerivatives);
    currentSimT = elapsedSeconds;
  }

  // Scale: Earth Radius (RE = 6,371,000 meters) maps to 1.5 units in Three.js scene
  const scale = 1.5 / RE;

  return [
    currentSimState[0] * scale,
    currentSimState[1] * scale,
    currentSimState[2] * scale
  ];
}
