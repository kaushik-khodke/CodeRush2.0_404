export interface GroundStation {
  id: string;
  name: string;
  lat: number;  // Latitude in degrees
  lon: number;  // Longitude in degrees
}

export const groundStations: GroundStation[] = [
  { id: "SVALBARD", name: "ULS-Svalbard", lat: 78.23, lon: 15.49 },
  { id: "SINGAPORE", name: "SGS-Singapore", lat: 1.35, lon: 103.82 },
  { id: "OBERPFAFFENHOFEN", name: "GCC-Oberpfaffenhofen", lat: 48.08, lon: 11.28 },
  { id: "FUCINO", name: "TTC-Fucino", lat: 41.97, lon: 13.60 },
  { id: "MALINDI", name: "GSS-Malindi", lat: -2.99, lon: 40.19 },
  { id: "REUNION", name: "TTC-Reunion", lat: -21.06, lon: 55.43 },
  { id: "HARTEBEESTHOEK", name: "GSS-Hartebeesthoek", lat: -25.88, lon: 27.70 },
  { id: "KOUROU", name: "ULS-Kourou", lat: 5.16, lon: -52.64 },
];
