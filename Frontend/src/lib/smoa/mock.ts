import type {
  AnomalyEvent,
  FaultInjection,
  PendingCommand,
  ReplayIncident,
  TelemetryFrame,
} from "./types";

/**
 * Deterministic-ish telemetry simulator.
 *
 * TODO(backend): remove once /ws/telemetry streams real 1 Hz frames. The
 * simulator is only used as a fallback when the socket cannot be reached so
 * the console is never blank during a demo.
 */
export class TelemetrySimulator {
  private met: number;
  private soc = 78.4;
  private faults: FaultInjection[] = [];

  constructor(startMet = 128_400) {
    this.met = startMet;
  }

  setFaults(faults: FaultInjection[]) {
    this.faults = faults;
  }

  private fault(kind: FaultInjection["kind"], subsystem: string) {
    return this.faults.find((f) => f.kind === kind && f.subsystem === subsystem)?.magnitude ?? 0;
  }

  next(): TelemetryFrame {
    this.met += 1;
    const t = this.met;
    const orbitAngle = (t / 5580) * 360 % 360;
    const eclipse = orbitAngle > 205 && orbitAngle < 320;

    const wob = (period: number, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase);

    const drift = this.fault("sensor_drift", "power");
    const hw = this.fault("hardware_fault", "adcs");
    const thermalHw = this.fault("hardware_fault", "thermal");
    const loss = this.fault("packet_loss", "comms");

    this.soc += eclipse ? -0.018 : 0.024;
    this.soc = Math.min(99.4, Math.max(21, this.soc));

    const arrayPower = eclipse ? 2 + wob(37) * 1.2 : 412 + wob(53) * 18;
    const busVoltage = 27.6 + (this.soc - 78) * 0.045 + wob(29) * 0.06 - drift * 0.9;

    return {
      met: t,
      t: Date.now(),
      orbitAngle,
      eclipse,
      power: {
        busVoltage,
        stateOfCharge: this.soc - drift * 1.5,
        arrayPower,
      },
      thermal: {
        batteryTemp: 18.2 + wob(211) * 2.4 + (eclipse ? -3.1 : 1.4) + thermalHw * 9,
        payloadTemp: -6.4 + wob(167, 1.1) * 3.2 + (eclipse ? -5.2 : 2.6),
        radiatorTemp: -31.5 + wob(233, 0.4) * 4.1 + thermalHw * 4,
      },
      adcs: {
        roll: wob(97) * 12 + hw * 22,
        pitch: wob(131, 0.8) * 8 + hw * 9,
        yaw: ((t / 3) % 360) - 180,
        bodyRate: 0.32 + Math.abs(wob(61)) * 0.14 + hw * 1.6,
        wheelRpm: 2840 + wob(89) * 210 + hw * 900,
      },
      comms: {
        signalDbm: -92.4 + wob(73) * 3.1 - loss * 8,
        packetLoss: Math.max(0, 0.4 + wob(41) * 0.3 + loss * 24),
        rttSeconds: 0.42 + wob(311) * 0.05,
      },
    };
  }
}

const now = () => Date.now();

/** TODO(backend): replace with GET /api/events */
export function mockEvents(): AnomalyEvent[] {
  return [];
}

/** TODO(backend): replace with GET /api/commands/pending */
export function mockPendingCommands(): PendingCommand[] {
  return [];
}

/** TODO(backend): replace with a Supabase-backed incident archive query. */
export function mockIncident(): ReplayIncident {
  const sim = new TelemetrySimulator(96_000);
  const frames: TelemetryFrame[] = [];
  for (let i = 0; i < 300; i += 1) {
    const f = sim.next();
    if (i > 140 && i < 240) {
      f.power.busVoltage -= (i - 140) * 0.012;
      f.power.stateOfCharge -= (i - 140) * 0.03;
    }
    frames.push(f);
  }
  const events = mockEvents();
  return {
    id: "INC-2026-041",
    name: "Eclipse bus-voltage droop — string 2 balancing FET",
    startedAt: Date.parse("2026-08-05T21:14:00Z"),
    durationSeconds: frames.length,
    frames,
    event: events[0]!,
    flagAtSecond: 168,
    operatorDecision: {
      decidedAtSecond: 214,
      operator: "FLIGHT · R. Okonkwo",
      action: "Approved PWR_SHED_PAYLOAD_HEATER_BUS",
      outcome: "Bus voltage recovered to 27.4 V within 2 orbits. Battery DoD held at 29%.",
    },
  };
}
