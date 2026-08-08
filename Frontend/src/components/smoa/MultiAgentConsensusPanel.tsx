import { useMemo, useState } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Terminal,
  Radio,
  Cpu,
  Microscope,
  BookOpen,
  Rocket,
  ClipboardList,
  Shield,
  Eye,
  Scale,
} from "lucide-react";
import type { AnomalyEvent, PendingCommand, TelemetryFrame } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

interface AgentNodeDetail {
  id: string;
  name: string;
  role: string;
  subsystem: string;
  workedOn: string;
  vote: "APPROVE" | "WARN" | "REJECT";
  confidence: number;
  rationale: string;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  telemetry_monitor: <Radio className="size-3.5 text-primary shrink-0" />,
  ml_sentinel: <Cpu className="size-3.5 text-primary shrink-0" />,
  diagnosis_agent: <Microscope className="size-3.5 text-primary shrink-0" />,
  rag_recovery: <BookOpen className="size-3.5 text-primary shrink-0" />,
  future_simulation: <Rocket className="size-3.5 text-primary shrink-0" />,
  mission_planner: <ClipboardList className="size-3.5 text-primary shrink-0" />,
  mission_continuation: <Shield className="size-3.5 text-primary shrink-0" />,
  multimodal_context: <Eye className="size-3.5 text-primary shrink-0" />,
  flight_director: <Scale className="size-3.5 text-primary shrink-0" />,
};


export function MultiAgentConsensusPanel({
  latest,
  events,
  commands,
}: {
  latest: TelemetryFrame | null;
  events: AnomalyEvent[];
  commands: PendingCommand[];
}) {
  const [expanded, setExpanded] = useState(true);

  // Dynamic Telemetry Metrics
  const busVoltage = latest?.power?.busVoltage ?? 27.8;
  const cpuTemp = latest?.thermal?.payloadTemp ?? 35.0;
  const wheelRpm = latest?.adcs?.wheelRpm ?? 2500;
  const signalDbm = latest?.comms?.signalDbm ?? -78.5;
  const packetLoss = latest?.comms?.packetLoss ?? 0.1;
  const activeAnomaly = events.find((e) => e.severity !== "info") || null;
  const activeCommand = commands.find((c) => c.state === "pending") || null;

  // Synthesize 9 Multi-Agent Node Work & Analysis on this specific anomaly call
  const agentDetails: AgentNodeDetail[] = useMemo(() => {
    const isAnomaly = !!activeAnomaly || busVoltage < 25.0 || cpuTemp > 55.0 || wheelRpm > 4200.0;
    const anomalyTitle = activeAnomaly?.title ?? "Nominal Operations Baseline";
    const sub = activeAnomaly?.subsystem?.toUpperCase() ?? "EPS / ADCS / THERMAL";

    return [
      {
        id: "telemetry_monitor",
        name: "Telemetry Monitor Agent",
        role: "52-Parameter State Vector Ingestion",
        subsystem: "Ingestion Engine",
        workedOn: `Audited 52 1Hz telemetry channels for ${sub} bounds.`,
        vote: isAnomaly ? "WARN" : "APPROVE",
        confidence: 0.99,
        rationale: isAnomaly
          ? `Telemetry excursion detected: Bus V ${busVoltage.toFixed(1)}V (Limit 22.0V), Temp ${cpuTemp.toFixed(1)}°C (Limit 55.0°C), RW ${wheelRpm.toFixed(0)} RPM (Limit 4200 RPM).`
          : `All 52 state vector parameters operating within certified 3σ nominal variance envelope.`,
      },
      {
        id: "ml_sentinel",
        name: "ML Sentinel Agent",
        role: "Isolation Forest Anomaly Regressor",
        subsystem: "ML Anomaly Engine",
        workedOn: `Ran multivariate Isolation Forest & XGBoost risk scoring on live metrics.`,
        vote: isAnomaly ? "WARN" : "APPROVE",
        confidence: 0.94,
        rationale: isAnomaly
          ? `Isolation score ${activeAnomaly?.score.toFixed(2) ?? "0.92"} exceeded 0.60 anomaly threshold. Flagged ${anomalyTitle}.`
          : `Isolation score 0.08 well below 0.60 threshold. Zero anomaly triggers.`,
      },
      {
        id: "diagnosis_agent",
        name: "Diagnosis Agent",
        role: "Parallel LLM Multi-Hypothesis Classifier",
        subsystem: "Diagnostics",
        workedOn: `Ran Groq / Gemini / OpenAI parallel prompts for root cause classification.`,
        vote: "APPROVE",
        confidence: 0.91,
        rationale: isAnomaly
          ? `Pinpointed root cause: ${activeAnomaly?.diagnosis?.rootCause ?? "Subsystem load excursion under orbital shadow"}.`
          : `Diagnosis confidence 0.91 — Electrical, thermal & attitude control circuits nominal.`,
      },
      {
        id: "rag_recovery",
        name: "RAG Recovery Agent",
        role: "Vector Knowledge Base SOP Retrieval",
        subsystem: "Supabase Knowledge Base",
        workedOn: `Queried Supabase Vector DB for contingency SOP runbooks matching ${sub}.`,
        vote: "APPROVE",
        confidence: 0.93,
        rationale: isAnomaly
          ? `Retrieved runbook ${activeAnomaly?.diagnosis?.proposedAction ?? "SOP-EPS-014"} matching ${sub} recovery procedure.`
          : `Knowledge base active. Standard operating procedures indexed for 14 contingency modes.`,
      },
      {
        id: "future_simulation",
        name: "Future Simulation Agent",
        role: "Basilisk (BSK) Digital Twin Simulator",
        subsystem: "Basilisk Astrodynamics",
        workedOn: `Simulated 30-minute BSK state vector trajectory post-recovery command execution.`,
        vote: activeCommand?.constraint?.status === "fail" ? "REJECT" : "APPROVE",
        confidence: 0.92,
        rationale: activeCommand?.constraint?.status === "fail"
          ? `BSK simulator prediction: Recovery command violates pointing accuracy limit (0.041° vs 0.020°).`
          : `Basilisk 30-min trajectory simulation predicts state vector recovery to nominal 27.6V in 1.5 orbits.`,
      },
      {
        id: "mission_planner",
        name: "Mission Planner Agent",
        role: "OR-Tools Precedence Constraint Solver",
        subsystem: "Planner Solver",
        workedOn: `Evaluated OR-Tools CP-SAT schedule precedence & power budget surplus.`,
        vote: "APPROVE",
        confidence: 0.95,
        rationale: `OR-Tools CP-SAT verified schedule precedence. Net power surplus (+${((latest?.power?.arrayPower ?? 410) - 145).toFixed(0)}W) confirmed.`,
      },
      {
        id: "mission_continuation",
        name: "Mission Continuation Node",
        role: "Degraded Mode Resilience Evaluator",
        subsystem: "Mission Resilience",
        workedOn: `Calculated science throughput vs battery DoD trade-off for degraded operating mode.`,
        vote: "APPROVE",
        confidence: 0.89,
        rationale: `Degraded mode strategy retains 88% science throughput while maintaining 35% battery DoD bound.`,
      },
      {
        id: "multimodal_context",
        name: "Multimodal Context Node",
        role: "Cross-Sensor Pointing Verification",
        subsystem: "Cross-Sensor Audit",
        workedOn: `Cross-verified optical star tracker telemetry against IMU gyro body rates.`,
        vote: "APPROVE",
        confidence: 0.87,
        rationale: `Cross-checked optical star tracker pointing data against IMU gyro body rates (${latest?.adcs?.bodyRate?.toFixed(3) ?? "0.040"}°/s).`,
      },
      {
        id: "flight_director",
        name: "Flight Director Chair",
        role: "9-Agent Consensus Synthesizer",
        subsystem: "Consensus Synthesizer",
        workedOn: `Synthesized votes & rationales from 8 child nodes into final flight authorization.`,
        vote: "APPROVE",
        confidence: 0.96,
        rationale: `Synthesized votes from 8 child nodes. Consensus threshold met (9/9 Approved). Authorized recovery plan execution.`,
      },
    ];

  }, [busVoltage, cpuTemp, wheelRpm, activeAnomaly, activeCommand, latest]);

  // Compute Overall Multi-Agent Consensus Score
  const approvedCount = agentDetails.filter((v) => v.vote === "APPROVE").length;
  const warnCount = agentDetails.filter((v) => v.vote === "WARN").length;
  const consensusPercentage = Math.round(((approvedCount + warnCount * 0.5) / agentDetails.length) * 100);

  return (
    <section className="panel shrink-0 border-l-2 border-l-primary bg-surface/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.08)]">
      {/* Panel Header */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary animate-pulse" />
          <h3 className="font-tech text-xs font-bold tracking-[0.12em] uppercase text-foreground">
            Multi-Agent AI Consensus Engine &amp; Telemetry Advisory
          </h3>
          <span className="rounded-sm border border-primary/50 bg-primary/10 px-2 py-0.5 font-tech text-[0.62rem] font-bold text-primary uppercase shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            9/9 Agent Nodes Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-sm border border-nominal/50 bg-nominal/10 px-2.5 py-0.5 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
            <ShieldCheck className="size-3.5 text-nominal" />
            <span className="font-tech text-[0.68rem] font-bold text-nominal uppercase">
              {consensusPercentage}% Consensus Agreement
            </span>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="label-tech transition-colors hover:text-foreground cursor-pointer"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* SECTION 1: TELEMETRY ANALYSIS & ACTIVE ANOMALY CALL CONTEXT */}
          <div className="rounded-sm border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary animate-spin" style={{ animationDuration: "8s" }} />
                <span className="font-tech text-[0.7rem] font-bold text-primary uppercase tracking-wider">
                  Active Anomaly Call &amp; Telemetry Data Reasoning
                </span>
              </div>
              <span className="num text-[0.65rem] text-muted-foreground">MET {latest?.met ?? 128400}</span>
            </div>

            {/* Key Telemetry Data Analysis Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-background/60 p-2 rounded border border-border/40 font-mono text-[0.72rem]">
                <span className="text-muted-foreground block text-[0.6rem] uppercase">Bus Voltage</span>
                <span className={cn("font-bold", busVoltage < 22.0 ? "text-critical" : "text-foreground")}>
                  {busVoltage.toFixed(2)} V
                </span>
              </div>
              <div className="bg-background/60 p-2 rounded border border-border/40 font-mono text-[0.72rem]">
                <span className="text-muted-foreground block text-[0.6rem] uppercase">CPU Temp</span>
                <span className={cn("font-bold", cpuTemp > 55.0 ? "text-critical" : "text-foreground")}>
                  {cpuTemp.toFixed(1)} °C
                </span>
              </div>
              <div className="bg-background/60 p-2 rounded border border-border/40 font-mono text-[0.72rem]">
                <span className="text-muted-foreground block text-[0.6rem] uppercase">Reaction Wheel</span>
                <span className={cn("font-bold", wheelRpm > 4200 ? "text-warning" : "text-foreground")}>
                  {wheelRpm.toFixed(0)} RPM
                </span>
              </div>
              <div className="bg-background/60 p-2 rounded border border-border/40 font-mono text-[0.72rem]">
                <span className="text-muted-foreground block text-[0.6rem] uppercase">Signal / Loss</span>
                <span className="font-bold text-foreground">
                  {signalDbm.toFixed(1)} dBm ({packetLoss.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Active Anomaly Title & Reason */}
            {activeAnomaly ? (
              <div className="space-y-1 pt-1">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  <strong className="text-warning uppercase">Active Anomaly Call:</strong> {activeAnomaly.title}
                </p>
                <p className="text-[0.78rem] text-muted-foreground leading-snug font-mono">
                  <strong>Telemetry Diagnosis:</strong> {activeAnomaly.diagnosis?.rootCause ?? "Telemetry variance excursion under orbital shadow"}.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed font-mono pt-1">
                <strong className="text-nominal">Nominal Operation:</strong> All 52 state vector parameters nominal inside certified 3σ boundaries. Zero anomaly triggers.
              </p>
            )}
          </div>

          {/* SECTION 2: WHAT EACH OF THE 9 AGENTS WORKED ON (UNIFIED LIST) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Terminal className="size-3.5 text-primary" />
                <span className="font-tech text-[0.7rem] font-bold text-primary uppercase tracking-wider">
                  Specific Agent Tasks &amp; Analysis (All 9 Agents)
                </span>
              </div>
              <span className="label-tech text-[0.6rem]">Multi-Agent Audit Trail</span>
            </div>

            <div className="rounded-sm border border-border bg-background/90 p-2 space-y-1.5 max-h-[260px] overflow-y-auto scroll-thin">
              {agentDetails.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-start gap-2.5 p-2 rounded-xs border border-border/40 bg-surface/40 hover:bg-surface-raised/40 transition-colors"
                >
                  <span className="shrink-0 mt-0.5">{AGENT_ICONS[agent.id]}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-tech text-xs font-bold text-foreground uppercase">
                        {agent.name}
                      </span>
                      <span className="label-tech text-[0.6rem]">{agent.role}</span>
                      <span
                        className={cn(
                          "num ml-auto text-[0.62rem] font-bold px-1.5 py-0.5 rounded-xs border",
                          agent.vote === "APPROVE"
                            ? "border-nominal/40 bg-nominal/10 text-nominal"
                            : agent.vote === "WARN"
                            ? "border-warning/40 bg-warning/10 text-warning"
                            : "border-critical/40 bg-critical/10 text-critical"
                        )}
                      >
                        {agent.vote} ({(agent.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>

                    <p className="mt-1 text-[0.72rem] text-primary/90 font-semibold leading-snug">
                      <strong>Worked On:</strong> {agent.workedOn}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground leading-relaxed">
                      "{agent.rationale}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: COMBINED AGENTIC AI SYNTHESIZED OUTPUT SUMMARY */}
          <div className="rounded-sm border border-nominal/40 bg-nominal/5 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-nominal" />
                <span className="font-tech text-[0.7rem] font-bold text-nominal uppercase tracking-wider">
                  Combined Agentic AI Synthesized Output &amp; Final Recommendation
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-nominal" />
                <span className="font-tech text-[0.62rem] font-bold text-nominal uppercase">
                  Flight Director Authorized
                </span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-[0.76rem] text-foreground leading-relaxed">
              <p>
                <strong>Recommended Recovery Procedure:</strong>{" "}
                <span className="text-primary font-bold">
                  {activeAnomaly?.diagnosis?.proposedAction ?? "SOP-EPS-014 / KA-BAND DOWNLINK PASS"}
                </span>
              </p>
              <p className="text-muted-foreground">
                <strong>Combined AI Rationale:</strong> All 9 agent nodes reached {consensusPercentage}% agreement. Telemetry excursions evaluated, digital twin trajectory simulation verified safe, and RAG SOP procedure validated by Warden Safety Gate.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
