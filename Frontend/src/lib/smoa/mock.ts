import type {
  Agent,
  AnomalyEvent,
  FaultInjection,
  PendingCommand,
  ReplayIncident,
  TelemetryFrame,
} from "./types";

/**
 * Telemetry simulator for live digital twin state frame generation.
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

/** 100% Dynamic Anomaly Events — NO predefined static defaults */
export function mockEvents(): AnomalyEvent[] {
  return [];
}

/** 100% Dynamic Pending Commands — NO predefined static defaults */
export function mockPendingCommands(): PendingCommand[] {
  return [];
}

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
  return {
    id: "INC-2026-041",
    name: "Eclipse bus-voltage droop — string 2 balancing FET",
    startedAt: Date.parse("2026-08-05T21:14:00Z"),
    durationSeconds: frames.length,
    frames,
    event: {
      id: "EVT-HIST",
      ts: Date.now() - 60000,
      subsystem: "power",
      severity: "critical",
      title: "Historical Event Analysis",
      detector: "ML Sentinel",
      score: 0.9,
      diagnosis: {
        rootCause: "Historical balancing FET excursion",
        confidence: 0.9,
        evidence: [],
        proposedAction: "Review SOP",
        model: "grok-4",
        latencyMs: 100
      }
    },
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
      lastAction: "Monitoring telemetry stream for state vector excursions",
      pipelineOrder: 3,
      outputType: "anomaly_score"
    },
    {
      id: "diagnosis_agent",
      name: "Diagnosis Agent",
      role: "Root Cause & Confidence",
      status: "active",
      confidence: 0.91,
      lastAction: "Evaluating subsystem failure root causes",
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
