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
  const base = now();
  return [
    {
      id: "EVT-4471",
      ts: base - 42_000,
      subsystem: "power",
      severity: "critical",
      title: "Battery bus voltage droop beyond 3σ envelope",
      detector: "ML Sentinel · resid-autoencoder v4.2",
      score: 0.94,
      diagnosis: {
        rootCause:
          "String 2 cell balancing FET is latched open, forcing the remaining strings to carry eclipse load and depressing bus voltage during each shadow pass.",
        confidence: 0.91,
        evidence: [
          "Bus voltage droop correlates 0.97 with eclipse entry over last 4 orbits",
          "String 2 current 0.0 A while strings 1/3 exceed nominal by 41%",
          "Balancing FET telemetry word stuck at 0x00 since MET 127:14:02",
          "No matching commanded load shed in uplink history",
        ],
        proposedAction: "Shed payload heater bus and switch to backup balancing FET on string 2.",
        model: "grok-4-diagnostics",
        latencyMs: 1840,
      },
    },
    {
      id: "EVT-4468",
      ts: base - 386_000,
      subsystem: "adcs",
      severity: "warning",
      title: "Reaction wheel 3 speed oscillation",
      detector: "ML Sentinel · spectral-drift v2.8",
      score: 0.67,
      diagnosis: {
        rootCause:
          "Bearing lubricant migration producing a 0.8 Hz torque ripple; wheel is compensating with speed excursions of ±210 RPM.",
        confidence: 0.74,
        evidence: [
          "New 0.8 Hz peak in wheel 3 tachometer spectrum",
          "Motor current up 12% at constant commanded torque",
          "Wheel 1/2/4 spectra unchanged",
        ],
        proposedAction: "Schedule wheel 3 bearing run-in at 4200 RPM for 20 minutes during next pass.",
        model: "grok-4-diagnostics",
        latencyMs: 1290,
      },
    },
    {
      id: "EVT-4465",
      ts: base - 903_000,
      subsystem: "thermal",
      severity: "warning",
      title: "Radiator outlet lagging predicted profile",
      detector: "ML Sentinel · twin-residual v3.1",
      score: 0.58,
      diagnosis: {
        rootCause:
          "Loop-A pump flow is ~8% below the digital twin prediction, consistent with partial coolant void after the last attitude slew.",
        confidence: 0.62,
        evidence: [
          "Radiator outlet 4.1 K warmer than twin prediction for 3 consecutive orbits",
          "Loop-A ΔP down 8.3%",
          "Loop-B nominal",
        ],
        proposedAction: "Run pump A at 110% for two orbits to clear the void, monitor ΔP.",
        model: "grok-4-diagnostics",
        latencyMs: 1105,
      },
    },
    {
      id: "EVT-4460",
      ts: base - 1_640_000,
      subsystem: "comms",
      severity: "info",
      title: "Downlink margin dip during ground station handover",
      detector: "ML Sentinel · link-budget v1.6",
      score: 0.31,
      diagnosis: {
        rootCause: "Expected keyhole geometry at Svalbard handover; margin recovered within 40 s.",
        confidence: 0.88,
        evidence: ["Dip window matches predicted keyhole", "Packet loss peaked at 2.1% then cleared"],
        proposedAction: "No action. Log for pass-planning statistics.",
        model: "grok-4-diagnostics",
        latencyMs: 760,
      },
    },
  ];
}

/** TODO(backend): replace with GET /api/commands/pending */
export function mockPendingCommands(): PendingCommand[] {
  const base = now();
  return [
    {
      id: "CMD-2201",
      ts: base - 38_000,
      command: "PWR_SHED_PAYLOAD_HEATER_BUS",
      subsystem: "power",
      summary:
        "Disable payload heater bus for 3 orbits to protect battery depth-of-discharge during eclipse.",
      irreversible: true,
      linkedEventId: "EVT-4471",
      state: "pending",
      constraint: {
        status: "pass",
        solver: "OR-Tools CP-SAT · flight-rules v18",
        reasoning:
          "All 26 flight rules satisfied. Payload survival temperature retains 6.4 K of margin across the worst-case eclipse.",
        checks: [
          { name: "FR-08 payload survival temp", ok: true, detail: "min −24.1 °C vs limit −30.5 °C" },
          { name: "FR-12 battery DoD", ok: true, detail: "peak 31% vs limit 40%" },
          { name: "FR-21 command window", ok: true, detail: "AOS Svalbard in 00:04:11" },
        ],
      },
    },
    {
      id: "CMD-2202",
      ts: base - 610_000,
      command: "ADCS_WHEEL3_BEARING_RUNIN",
      subsystem: "adcs",
      summary: "Spin reaction wheel 3 to 4200 RPM for 20 minutes to redistribute bearing lubricant.",
      irreversible: false,
      linkedEventId: "EVT-4468",
      state: "pending",
      constraint: {
        status: "fail",
        solver: "OR-Tools CP-SAT · flight-rules v18",
        reasoning:
          "Momentum budget violated: run-in overlaps the imaging window and would exceed the pointing-stability rule.",
        checks: [
          { name: "FR-03 pointing stability", ok: false, detail: "0.041° RMS vs limit 0.020° RMS" },
          { name: "FR-17 momentum envelope", ok: false, detail: "94% of saturation vs limit 80%" },
          { name: "FR-21 command window", ok: true, detail: "within contact" },
        ],
      },
    },
    {
      id: "CMD-2203",
      ts: base - 1_210_000,
      command: "THERM_PUMPA_OVERSPEED_110",
      subsystem: "thermal",
      summary: "Command coolant pump A to 110% for two orbits to clear a suspected coolant void.",
      irreversible: true,
      linkedEventId: "EVT-4465",
      state: "pending",
      constraint: {
        status: "pass",
        solver: "OR-Tools CP-SAT · flight-rules v18",
        reasoning: "Pump duty cycle and power draw remain inside certified limits for the requested duration.",
        checks: [
          { name: "FR-05 pump duty cycle", ok: true, detail: "110% for 190 min vs limit 115% / 240 min" },
          { name: "FR-12 bus load", ok: true, detail: "+38 W, margin 210 W" },
        ],
      },
    },
  ];
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

export function mockAgents(): Agent[] {
  return [
    {
      id: "mission_planner",
      name: "Mission Planner Agent",
      role: "Schedule Optimization",
      status: "active",
      confidence: 0.95,
      lastAction: "Optimized science window schedules for Lunar transit",
      pipelineOrder: 1,
      outputType: "plan"
    },
    {
      id: "telemetry_monitor",
      name: "Telemetry Monitoring Agent",
      role: "Live Data Ingestion",
      status: "active",
      confidence: 0.99,
      lastAction: "Ingesting EPS-2 bus voltage frames at 1 Hz",
      pipelineOrder: 2,
      outputType: "telemetry"
    },
    {
      id: "ml_sentinel",
      name: "Machine Learning Sentinel",
      role: "Anomaly Detection (Isolation Forest)",
      status: "active",
      confidence: 0.94,
      lastAction: "Flagged anomaly EVT-4471 with isolation score 0.92",
      pipelineOrder: 3,
      outputType: "anomaly_score"
    },
    {
      id: "diagnosis_agent",
      name: "Diagnosis Agent",
      role: "Root Cause & Confidence",
      status: "active",
      confidence: 0.91,
      lastAction: "Pinpointed imbalance in EPS-2 balancing FET",
      pipelineOrder: 4,
      outputType: "diagnosis"
    },
    {
      id: "mission_continuation",
      name: "Mission Continuation Agent",
      role: "Degraded-Mode Replanning",
      status: "active",
      confidence: 0.89,
      lastAction: "Evaluated power recovery vs safety margins",
      pipelineOrder: 5,
      outputType: "continuation"
    },
    {
      id: "multimodal_context",
      name: "Multimodal Context Agent",
      role: "Sensor & Operator Cross-Check",
      status: "active",
      confidence: 0.87,
      lastAction: "Cross-checked operator thermal reports against EPS sensors",
      pipelineOrder: 6,
      outputType: "context"
    },
    {
      id: "rag_recovery",
      name: "RAG Recovery Agent",
      role: "SOP & Runbook Retrieval",
      status: "active",
      confidence: 0.93,
      lastAction: "Retrieved SOP-EPS-014 and 3 similar historic failures",
      pipelineOrder: 7,
      outputType: "recovery"
    },
    {
      id: "future_simulation",
      name: "Future Simulation Agent",
      role: "What-If Outcome Modeling",
      status: "active",
      confidence: 0.92,
      lastAction: "Ran 2 what-if battery models for the continuation plan",
      pipelineOrder: 8,
      outputType: "simulation"
    },
    {
      id: "flight_director",
      name: "Flight Director Agent",
      role: "Recommendation Synthesis",
      status: "active",
      confidence: 0.96,
      lastAction: "Synthesized safe-mode recommendations and uplink procedures",
      pipelineOrder: 9,
      outputType: "director_summary"
    }
  ];
}
