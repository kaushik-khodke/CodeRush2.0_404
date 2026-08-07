// Shared domain types for the Space Mission Operations Automator (SMOA).

export type Subsystem = "power" | "thermal" | "adcs" | "comms";

export interface PowerFrame {
  /** Battery bus voltage, volts */
  busVoltage: number;
  /** State of charge, percent 0-100 */
  stateOfCharge: number;
  /** Solar array output, watts */
  arrayPower: number;
}

export interface ThermalFrame {
  /** Battery pack temperature, deg C */
  batteryTemp: number;
  /** Payload deck temperature, deg C */
  payloadTemp: number;
  /** Radiator outlet temperature, deg C */
  radiatorTemp: number;
}

export interface AdcsFrame {
  /** Attitude, degrees */
  roll: number;
  pitch: number;
  yaw: number;
  /** Body rate magnitude, deg/s */
  bodyRate: number;
  /** Reaction wheel speed, RPM */
  wheelRpm: number;
}

export interface CommsFrame {
  /** Downlink signal strength, dBm */
  signalDbm: number;
  /** Packet loss, percent 0-100 */
  packetLoss: number;
  /** Round trip light time, seconds */
  rttSeconds: number;
}

export interface TelemetryFrame {
  /** Mission elapsed time in seconds */
  met: number;
  /** Wall-clock epoch ms of the frame */
  t: number;
  power: PowerFrame;
  thermal: ThermalFrame;
  adcs: AdcsFrame;
  comms: CommsFrame;
  /** Orbital true anomaly, degrees — drives the orbit position indicator */
  orbitAngle: number;
  eclipse: boolean;
  /** Live ML Sentinel anomaly score 0-1 */
  anomalyScore?: number;
}

export type LinkStatus = "connecting" | "live" | "degraded" | "disconnected";

export type Severity = "info" | "warning" | "critical";

export interface Diagnosis {
  /** Root-cause summary produced by the Grok diagnostic trace */
  rootCause: string;
  /** 0-1 model confidence */
  confidence: number;
  /** Ordered evidence chain */
  evidence: string[];
  proposedAction: string;
  model: string;
  latencyMs: number;
  /** Predictive regression targets from ML model */
  predictiveMetrics?: {
    remainingBatteryLife?: string;
    estCpuTemp30min?: string;
  };
  /** Active safety constraint bounds violations */
  constraintViolations?: string[];
}

export interface AnomalyEvent {
  id: string;
  ts: number;
  subsystem: Subsystem;
  severity: Severity;
  title: string;
  detector: string;
  /** Sentinel anomaly score 0-1 */
  score: number;
  diagnosis: Diagnosis | null;
}

export type ConstraintStatus = "pass" | "fail";

export interface ConstraintCheck {
  status: ConstraintStatus;
  solver: string;
  reasoning: string;
  checks: { name: string; ok: boolean; detail: string }[];
}

export type CommandState = "pending" | "approved" | "rejected";

export interface PendingCommand {
  id: string;
  ts: number;
  command: string;
  subsystem: Subsystem;
  summary: string;
  irreversible: boolean;
  linkedEventId: string | null;
  constraint: ConstraintCheck;
  state: CommandState;
}

export interface ReplayIncident {
  id: string;
  name: string;
  startedAt: number;
  durationSeconds: number;
  frames: TelemetryFrame[];
  event: AnomalyEvent;
  /** Second offset into the incident when the anomaly flag fired */
  flagAtSecond: number;
  operatorDecision: {
    decidedAtSecond: number;
    operator: string;
    action: string;
    outcome: string;
  };
}

export type FaultKind = "sensor_drift" | "packet_loss" | "hardware_fault";

export interface FaultInjection {
  kind: FaultKind;
  subsystem: Subsystem;
  magnitude: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "standby" | "watching";
  confidence: number;
  lastAction: string;
  pipelineOrder: number;
  outputType: string;
}

export interface ActivityScheduleItem {
  id: string;
  activityName: string;
  activityType: "OBSERVATION" | "DOWNLINK" | "MAINTENANCE" | "CALIBRATION" | "SAFE_MODE_TRANSITION";
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "FEASIBLE";
  priority: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  resourceRequirements: {
    powerWatts: number;
    batterySocMin: number;
    storageGb: number;
    bandwidthMbps?: number;
  };
  precedenceConstraints: string[];
  selectionRationale: string;
}

export interface CommunicationWindowInfo {
  id: string;
  groundStationName: string;
  startTime: string;
  endTime: string;
  maxElevationDeg: number;
  bandwidthMbps: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
}
