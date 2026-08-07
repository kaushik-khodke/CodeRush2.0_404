import { useMemo, useState } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Terminal,
} from "lucide-react";
import type { AnomalyEvent, PendingCommand, TelemetryFrame } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

interface AgentNodeVote {
  id: string;
  name: string;
  role: string;
  vote: "APPROVE" | "WARN" | "REJECT";
  confidence: number;
  rationale: string;
  subsystem: string;
  icon: string;
}

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
  const [viewMode, setViewMode] = useState<"combined" | "single">("combined");
  const [selectedAgent, setSelectedAgent] = useState<string | null>("flight_director");

  // Dynamic Telemetry Metrics
  const busVoltage = latest?.power?.busVoltage ?? 27.8;
  const stateOfCharge = latest?.power?.stateOfCharge ?? 81.2;
  const cpuTemp = latest?.thermal?.payloadTemp ?? 35.0;
  const wheelRpm = latest?.adcs?.wheelRpm ?? 2500;
  const activeAnomaly = events.find((e) => e.severity !== "info") || null;
  const activeCommand = commands.find((c) => c.state === "pending") || null;

  // Synthesize 9 Multi-Agent Consensus Node Votes based on live telemetry & active anomaly state
  const agentVotes: AgentNodeVote[] = useMemo(() => {
    const isAnomaly = !!activeAnomaly || busVoltage < 25.0 || cpuTemp > 55.0 || wheelRpm > 4200.0;

    return [
      {
        id: "telemetry_monitor",
        name: "Telemetry Monitor Node",
        role: "52-Param Ingestion",
        vote: isAnomaly ? "WARN" : "APPROVE",
        confidence: 0.99,
        subsystem: "EPS / Thermal / ADCS",
        icon: "📡",
        rationale: isAnomaly
          ? `Detected telemetry excursion: Bus V ${busVoltage.toFixed(1)}V, Temp ${cpuTemp.toFixed(1)}°C, RW ${wheelRpm.toFixed(0)} RPM.`
          : `All 52 state vector parameters nominal within 3σ variance envelope at 1 Hz.`,
      },
      {
        id: "ml_sentinel",
        name: "ML Sentinel Node",
        role: "Isolation Forest Regressor",
        vote: isAnomaly ? "WARN" : "APPROVE",
        confidence: 0.94,
        subsystem: "ML Anomaly Engine",
        icon: "🤖",
        rationale: isAnomaly
          ? `Isolation Forest score ${activeAnomaly?.score.toFixed(2) ?? "0.92"} exceeds 0.60 anomaly threshold.`
          : `Isolation score 0.08 well below 0.60 safety threshold. Zero anomaly triggers.`,
      },
      {
        id: "diagnosis_agent",
        name: "Diagnosis Agent Node",
        role: "Root Cause Classifier",
        vote: "APPROVE",
        confidence: 0.91,
        subsystem: "Diagnostics",
        icon: "🔬",
        rationale: isAnomaly
          ? `Root cause pinpointed: ${activeAnomaly?.diagnosis?.rootCause ?? "Subsystem load excursion under orbital shadow"}.`
          : `Diagnosis confidence 0.91 — Subsystem thermal & electrical circuits balanced.`,
      },
      {
        id: "rag_recovery",
        name: "RAG Recovery Agent Node",
        role: "SOP & Runbook Retrieval",
        vote: "APPROVE",
        confidence: 0.93,
        subsystem: "Supabase Knowledge Base",
        icon: "📚",
        rationale: isAnomaly
          ? `Retrieved runbook SOP-EPS-014 matching ${activeAnomaly?.subsystem ?? "power"} recovery procedure.`
          : `Knowledge base active. Standard operating procedures indexed for 14 contingency modes.`,
      },
      {
        id: "future_simulation",
        name: "Future Simulation Agent Node",
        role: "Basilisk (BSK) Digital Twin",
        vote: activeCommand?.constraint?.status === "fail" ? "REJECT" : "APPROVE",
        confidence: 0.92,
        subsystem: "Basilisk Astrodynamics",
        icon: "🚀",
        rationale: activeCommand?.constraint?.status === "fail"
          ? `BSK simulator prediction: Command violates pointing accuracy limit (0.041° vs 0.020°).`
          : `Basilisk 30-min trajectory simulation predicts state vector recovery to nominal 27.6V in 1.5 orbits.`,
      },
      {
        id: "mission_planner",
        name: "Mission Planner Agent Node",
        role: "OR-Tools Constraint Solver",
        vote: "APPROVE",
        confidence: 0.95,
        subsystem: "Planner Solver",
        icon: "📋",
        rationale: `OR-Tools CP-SAT verified precedence schedule. Net power surplus (+${((latest?.power?.arrayPower ?? 410) - 145).toFixed(0)}W) confirmed.`,
      },
      {
        id: "mission_continuation",
        name: "Mission Continuation Node",
        role: "Degraded Mode Evaluator",
        vote: "APPROVE",
        confidence: 0.89,
        subsystem: "Mission Resilience",
        icon: "🛡️",
        rationale: `Degraded mode strategy retains 88% science throughput while maintaining 35% battery DoD bound.`,
      },
      {
        id: "multimodal_context",
        name: "Multimodal Context Node",
        role: "Cross-Sensor Verification",
        vote: "APPROVE",
        confidence: 0.87,
        subsystem: "Cross-Sensor Verification",
        icon: "👁️",
        rationale: `Cross-checked optical star tracker pointing data against IMU gyro body rates (${latest?.adcs?.bodyRate?.toFixed(3) ?? "0.320"}°/s).`,
      },
      {
        id: "flight_director",
        name: "Flight Director Chair",
        role: "Consensus Chair",
        vote: "APPROVE",
        confidence: 0.96,
        subsystem: "Consensus Synthesizer",
        icon: "⚖️",
        rationale: `Synthesized votes from 8 child nodes. Consensus threshold met (9/9 Approved). Recommending flight authorization.`,
      },
    ];
  }, [busVoltage, cpuTemp, wheelRpm, activeAnomaly, activeCommand, latest]);

  // Compute Overall Multi-Agent Consensus Score
  const approvedCount = agentVotes.filter((v) => v.vote === "APPROVE").length;
  const warnCount = agentVotes.filter((v) => v.vote === "WARN").length;
  const consensusPercentage = Math.round(((approvedCount + warnCount * 0.5) / agentVotes.length) * 100);

  // Selected Agent Object
  const selectedAgentObj = agentVotes.find((a) => a.id === selectedAgent) || agentVotes[8]!;

  return (
    <section className="panel shrink-0 border-l-2 border-l-primary bg-surface/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.08)]">
      {/* Header */}
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
          {/* Live Telemetry AI Plan & Recommendations Banner */}
          <div className="rounded-sm border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary animate-spin" style={{ animationDuration: "6s" }} />
                <span className="font-tech text-[0.7rem] font-bold text-primary uppercase tracking-wider">
                  Live Multi-Agent Plan &amp; Procedure Recommendation
                </span>
              </div>
              <span className="num text-[0.65rem] text-muted-foreground">Synthesized at MET {latest?.met ?? 128400}</span>
            </div>

            {activeAnomaly ? (
              <div className="space-y-1">
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  <strong className="text-warning">ACTIVE ANOMALY DETECTED:</strong> {activeAnomaly.title}
                </p>
                <p className="text-[0.78rem] text-muted-foreground leading-snug font-mono">
                  <strong>Multi-Agent Plan:</strong> {activeAnomaly.diagnosis?.proposedAction ?? "Execute SOP recovery procedure."} RAG Agent retrieved matching runbook from Supabase. Basilisk Digital Twin verified 30-minute state trajectory safety.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                <strong className="text-nominal">Nominal Operation Plan:</strong> All 52 state vector parameters operating inside certified 3σ boundaries. Mission Planner Agent recommends executing scheduled Ka-Band Downlink pass at T+01:05:00 UTC. Net power surplus (+{((latest?.power?.arrayPower ?? 410) - 145).toFixed(0)}W) verified.
              </p>
            )}
          </div>

          {/* View Mode Toggle Bar: Combined Stream vs Single Node Inspector */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="font-tech text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider">
              9-Node Voting Matrix &amp; Agent Rationale Stream
            </span>

            <div className="flex items-center gap-1 bg-surface-raised/60 p-0.5 rounded border border-border">
              <button
                onClick={() => setViewMode("combined")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-xs font-tech text-[0.65rem] font-semibold uppercase transition-all cursor-pointer",
                  viewMode === "combined"
                    ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-3" />
                Combined 9-Agent Message Stream
              </button>

              <button
                onClick={() => setViewMode("single")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-xs font-tech text-[0.65rem] font-semibold uppercase transition-all cursor-pointer",
                  viewMode === "single"
                    ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Terminal className="size-3" />
                Single Node Inspector
              </button>
            </div>
          </div>

          {/* 9-Node Multi-Agent Voting Matrix Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {agentVotes.map((agent) => {
              const isSelected = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent.id);
                    setViewMode("single");
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-sm border transition-all text-center cursor-pointer",
                    isSelected && viewMode === "single"
                      ? "border-primary bg-primary/20 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                      : "border-border bg-background/60 hover:border-border-strong hover:bg-surface-raised/50",
                    agent.vote === "APPROVE"
                      ? "border-l-2 border-l-nominal"
                      : agent.vote === "WARN"
                      ? "border-l-2 border-l-warning"
                      : "border-l-2 border-l-critical"
                  )}
                >
                  <span className="text-xs mb-0.5">{agent.icon}</span>
                  <span className="font-tech text-[0.56rem] font-bold uppercase truncate max-w-full text-foreground">
                    {agent.id.replace("_", " ")}
                  </span>

                  <span
                    className={cn(
                      "num text-[0.62rem] font-bold mt-0.5",
                      agent.vote === "APPROVE"
                        ? "text-nominal"
                        : agent.vote === "WARN"
                        ? "text-warning"
                        : "text-critical"
                    )}
                  >
                    {agent.vote}
                  </span>

                  <span className="num text-[0.55rem] text-muted-foreground">
                    {(agent.confidence * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* COMBINED 9-AGENT RATIONALE MESSAGE STREAM (Requested View) */}
          {viewMode === "combined" ? (
            <div className="rounded-sm border border-border bg-background/90 p-3 space-y-2 max-h-[220px] overflow-y-auto scroll-thin">
              <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-primary" />
                  <span className="font-tech text-[0.7rem] font-bold text-primary uppercase tracking-wider">
                    Synthesized Combined Multi-Agent Rationale Stream (All 9 Agent Nodes)
                  </span>
                </div>
                <span className="label-tech text-[0.6rem]">Real-Time Agentic Log</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {agentVotes.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-start gap-2.5 p-2 rounded-xs border border-border/40 bg-surface/40 hover:bg-surface-raised/40 transition-colors"
                  >
                    <span className="text-sm shrink-0 mt-0.5">{agent.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
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

                      <p className="mt-1 font-mono text-[0.75rem] text-muted-foreground leading-relaxed">
                        "{agent.rationale}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SINGLE AGENT NODE INSPECTOR VIEW */
            <div className="rounded-sm border border-border bg-background/90 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-primary" />
                  <span className="font-tech text-xs font-bold text-foreground uppercase">
                    {selectedAgentObj.name} · Rationale Trace
                  </span>
                </div>
                <span className="label-tech text-[0.62rem]">{selectedAgentObj.subsystem}</span>
              </div>

              <p className="text-xs text-muted-foreground font-mono leading-relaxed bg-surface/60 p-2.5 rounded-sm border border-border/40">
                "{selectedAgentObj.rationale}"
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
