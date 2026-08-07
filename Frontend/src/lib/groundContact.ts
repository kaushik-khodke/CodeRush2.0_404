// Ground Contact calculations for ORION AI digital twin.
// Calculates satellite elevation and azimuth relative to a ground station in ECI/ECEF frames.

import { RE } from "./orbit";

const EarthRadiusScale = 1.5;
const EarthRotationSpeed = (2 * Math.PI) / 86400; // Earth rotation in radians per second

export interface GroundStationRef {
  lat: number;
  lon: number;
}

/**
 * Calculates the ECI Cartesian position of a ground station at time t.
 */
export function getStationECIPosition(station: GroundStationRef, met: number): [number, number, number] {
  const latRad = (station.lat * Math.PI) / 180;
  const lonRad = (station.lon * Math.PI) / 180;
  // Earth's rotation angle since epoch
  const theta = EarthRotationSpeed * met;

  const x = EarthRadiusScale * Math.cos(latRad) * Math.cos(lonRad + theta);
  const y = EarthRadiusScale * Math.cos(latRad) * Math.sin(lonRad + theta);
  const z = EarthRadiusScale * Math.sin(latRad);

  return [x, y, z];
}

/**
 * Calculates the elevation angle in degrees of a satellite from a ground station.
 */
export function elevationAngle(
  satPos: [number, number, number],
  station: GroundStationRef,
  met: number
): number {
  const [sx, sy, sz] = satPos;
  const [gx, gy, gz] = getStationECIPosition(station, met);

  // Range vector from GS to satellite
  const rx = sx - gx;
  const ry = sy - gy;
  const rz = sz - gz;
  const rMag = Math.sqrt(rx * rx + ry * ry + rz * rz);
  if (rMag === 0) return 0;

  // Local vertical (Up vector) of ground station (normalized GS position)
  const gMag = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const ux = gx / gMag;
  const uy = gy / gMag;
  const uz = gz / gMag;

  // Dot product of range vector and local vertical
  const dot = rx * ux + ry * uy + rz * uz;

  // Sine of elevation angle
  const sinEl = dot / rMag;
  
  // Return elevation in degrees
  return (Math.asin(Math.max(-1, Math.min(1, sinEl))) * 180) / Math.PI;
}

/**
 * Calculates the azimuth angle in degrees of a satellite from a ground station.
 */
export function azimuthAngle(
  satPos: [number, number, number],
  station: GroundStationRef,
  met: number
): number {
  const [sx, sy, sz] = satPos;
  const [gx, gy, gz] = getStationECIPosition(station, met);

  const rx = sx - gx;
  const ry = sy - gy;
  const rz = sz - gz;

  const latRad = (station.lat * Math.PI) / 180;
  const lonRad = (station.lon * Math.PI) / 180;
  const alpha = lonRad + EarthRotationSpeed * met;

  // Local vertical (Up) vector
  const gMag = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const ux = gx / gMag;
  const uy = gy / gMag;
  const uz = gz / gMag;

  // Local East vector: [-sin(alpha), cos(alpha), 0]
  const ex = -Math.sin(alpha);
  const ey = Math.cos(alpha);
  const ez = 0;

  // Local North vector: Up x East
  const nx = uy * ez - uz * ey;
  const ny = uz * ex - ux * ez;
  const nz = ux * ey - uy * ex;

  // Project range vector onto East and North axes
  const rE = rx * ex + ry * ey + rz * ez;
  const rN = rx * nx + ry * ny + rz * nz;

  // Azimuth in radians clockwise from North
  let az = Math.atan2(rE, rN);
  if (az < 0) az += 2 * Math.PI;

  return (az * 180) / Math.PI;
}

/**
 * Calculates the bearing between two geodetic coordinates in degrees.
 */
export function bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}
