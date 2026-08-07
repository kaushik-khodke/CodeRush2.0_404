import type { ActivityScheduleItem, CommunicationWindowInfo } from "./types";

export function mockActivitySchedules(): ActivityScheduleItem[] {
  return [
    {
      id: "ACT-101",
      activityName: "Lunar Mare Imbrium High-Res Multispectral Survey",
      activityType: "OBSERVATION",
      status: "IN_PROGRESS",
      priority: 1,
      startTime: "T+00:15:00",
      endTime: "T+00:45:00",
      durationMinutes: 30,
      resourceRequirements: {
        powerWatts: 145,
        batterySocMin: 45,
        storageGb: 8.4,
      },
      precedenceConstraints: ["Battery_SOC >= 45%", "Pointing accuracy < 0.05°", "Sunlit phase active"],
      selectionRationale:
        "Scheduled during peak solar array illumination (410W) to offset 145W payload draw while preserving battery DoD above 70%. Selected prior to downlink pass to maximize onboard storage buffer efficiency.",
    },
    {
      id: "ACT-102",
      activityName: "SGS Svalbard High-Speed Ka-Band Data Downlink",
      activityType: "DOWNLINK",
      status: "SCHEDULED",
      priority: 1,
      startTime: "T+01:05:00",
      endTime: "T+01:25:00",
      durationMinutes: 20,
      resourceRequirements: {
        powerWatts: 180,
        batterySocMin: 50,
        storageGb: -12.5,
        bandwidthMbps: 50,
      },
      precedenceConstraints: ["Communication_Window == 1", "Ground Station Line of Sight (Svalbard SGS)", "Transmitter Temp < 55°C"],
      selectionRationale:
        "Pass window alignment with SGS Svalbard station (max elevation 68.4°). Empties 12.5 GB from solid-state recorder ahead of Orbit 146 observation sweep.",
    },
    {
      id: "ACT-103",
      activityName: "ADCS Star Tracker & Gyroscope Recalibration",
      activityType: "CALIBRATION",
      status: "SCHEDULED",
      priority: 2,
      startTime: "T+01:40:00",
      endTime: "T+01:55:00",
      durationMinutes: 15,
      resourceRequirements: {
        powerWatts: 45,
        batterySocMin: 35,
        storageGb: 0.2,
      },
      precedenceConstraints: ["Spacecraft body rates < 0.02°/s", "Reaction wheel speed stabilized < 3000 RPM"],
      selectionRationale:
        "Executes during orbital eclipse to eliminate solar glare on Optical Star Tracker B lens assembly.",
    },
    {
      id: "ACT-104",
      activityName: "Reaction Wheel 3 Desaturation & Momentum Dump",
      activityType: "MAINTENANCE",
      status: "FEASIBLE",
      priority: 2,
      startTime: "T+02:15:00",
      endTime: "T+02:30:00",
      durationMinutes: 15,
      resourceRequirements: {
        powerWatts: 90,
        batterySocMin: 40,
        storageGb: 0.1,
      },
      precedenceConstraints: ["Magnetorquer coils operational", "Earth B-field magnitude > 35 uT"],
      selectionRationale:
        "Dumps accumulated angular momentum from Reaction Wheel 3 (currently 2500 RPM) using magnetic torque rods during equatorial magnetic equator crossing.",
    },
    {
      id: "ACT-105",
      activityName: "Emergency Safe-Mode Contingency Transition",
      activityType: "SAFE_MODE_TRANSITION",
      status: "FEASIBLE",
      priority: 3,
      startTime: "T+03:00:00",
      endTime: "T+03:10:00",
      durationMinutes: 10,
      resourceRequirements: {
        powerWatts: 25,
        batterySocMin: 20,
        storageGb: 0.0,
      },
      precedenceConstraints: ["Unrecoverable power or thermal anomaly detected"],
      selectionRationale:
        "Standby contingency runbook. Sheds non-essential payload heaters, aligns solar arrays Sun-pointing, and locks transmitter to low-rate omni beacon.",
    },
  ];
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
    {
      id: "CW-803",
      groundStationName: "Canberra Ground Station (Australia)",
      startTime: "T+04:15:00",
      endTime: "T+04:35:00",
      maxElevationDeg: 54.2,
      bandwidthMbps: 50.0,
      status: "UPCOMING",
    },
  ];
}
