import type { ActivityScheduleItem, CommunicationWindowInfo } from "./types";

export function mockActivitySchedules(): ActivityScheduleItem[] {
  // NO hardcoded static tasks — 100% dynamic from Supabase database!
  return [];
}

export function mockCommunicationWindows(): CommunicationWindowInfo[] {
  return [
    {
      id: "CW-801",
      groundStationName: "SGS Svalbard (Norway)",
      startTime: "T+01:05:00",
      endTime: "T+01:25:00",
      maxElevationDeg: 68.4,
      bandwidthMbps: 50.0,
      status: "UPCOMING",
    },
    {
      id: "CW-802",
      groundStationName: "Goldstone Deep Space Complex (USA)",
      startTime: "T+02:40:00",
      endTime: "T+03:05:00",
      maxElevationDeg: 82.1,
      bandwidthMbps: 120.0,
      status: "UPCOMING",
    },
  ];
}
