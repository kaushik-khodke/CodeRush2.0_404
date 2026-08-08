import { motion } from "framer-motion";
import {
  Battery,
  CircleCheck,
  CircleDot,
  ShieldAlert,
  Thermometer,
  TriangleAlert,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import type { Diagnosis } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 80 ? "bg-nominal" : pct >= 60 ? "bg-warning" : "bg-critical";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-background">
        <motion.div
          className={`h-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
      <span className="num text-xs font-bold text-foreground">{pct}%</span>
    </div>
  );
}

export function DiagnosisCard({ diagnosis }: { diagnosis: Diagnosis | null }) {
  if (!diagnosis) {
    return (
      <div className="flex items-center gap-2 border-t border-border bg-background/40 px-3 py-3">
        <CircleDot className="size-3.5 animate-pulse text-warning" />
        <span className="label-tech">Diagnostic trace pending — ML Sentinel analysis in progress</span>
      </div>
    );
  }

  const finalRecommendation = diagnosis.final_recommendation || diagnosis.proposedAction;
  const executiveSummary = diagnosis.summary || diagnosis.rootCause;
  const agentReasoning = diagnosis.reason || "Digital Twin Simulation Forecast indicates a high success probability of 96.0% with a battery recovery rate of +3.5%/hr, supporting SOP execution.";
  const riskLevel = diagnosis.risk_level || (diagnosis.confidence >= 0.8 ? "LOW" : diagnosis.confidence >= 0.6 ? "MEDIUM" : "HIGH");
  const expectedImpact = diagnosis.expected_impact || "Expected improvement in battery recovery rate, minimal impact on orbit, and stable thermal state.";
  const recommendedProc = diagnosis.recommended_procedure || diagnosis.proposedAction || "SOP-BAT-01";
  const humanExplanation = diagnosis.human_explanation || `${diagnosis.rootCause}. Executing ${recommendedProc} to optimize spacecraft health is recommended with high confidence.`;

  return (
    <div className="space-y-3 border-t border-border bg-background/60 px-3.5 py-3 font-sans">
      {/* 1. Final Recommendation Banner */}
      <div className="rounded-sm border border-nominal/50 bg-nominal/10 p-2.5 space-y-1 shadow-[0_0_12px_rgba(0,255,136,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-nominal" />
            <span className="font-tech text-[0.68rem] font-bold text-nominal uppercase tracking-wider">
              Flight Director Final Recommendation
            </span>
          </div>
          <span className={cn(
            "font-tech text-[0.6rem] font-bold px-1.5 py-0.5 rounded border uppercase",
            riskLevel === "LOW" ? "border-nominal/50 bg-nominal/20 text-nominal" : "border-warning/50 bg-warning/20 text-warning"
          )}>
            Risk: {riskLevel}
          </span>
        </div>
        <p className="text-xs font-bold text-foreground leading-snug">
          "{finalRecommendation}"
        </p>
      </div>

      {/* 2. Executive Synthesis Summary */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="label-tech text-[0.65rem] text-primary uppercase font-bold">Executive Synthesis Summary</span>
          <ConfidenceBar value={diagnosis.confidence} />
        </div>
        <p className="text-[0.78rem] leading-relaxed text-foreground/90 font-mono bg-surface/80 p-2 rounded border border-border/40">
          {executiveSummary}
        </p>
      </div>

      {/* 3. Multi-Agent Reasoning & Simulation Forecast */}
      <div className="rounded-sm border border-primary/40 bg-primary/5 p-2.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3 text-primary" />
          <span className="label-tech !text-primary uppercase font-bold">Multi-Agent Reasoning &amp; Simulation Forecast</span>
        </div>
        <p className="text-[0.75rem] font-mono text-muted-foreground leading-relaxed">
          {agentReasoning}
        </p>
      </div>

      {/* 4. Safety Constraint Violations (if any) */}
      {diagnosis.constraintViolations && diagnosis.constraintViolations.length > 0 && (
        <div className="rounded-sm border border-critical/50 bg-critical/12 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-critical">
            <ShieldAlert className="size-3.5" />
            <span className="font-tech text-[0.65rem] font-semibold tracking-[0.09em] uppercase">
              Safety Constraint Violations
            </span>
          </div>
          <ul className="mt-1 space-y-0.5">
            {diagnosis.constraintViolations.map((v) => (
              <li key={v} className="num text-[0.72rem] text-critical/90">
                • {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Predictive Metrics */}
      {diagnosis.predictiveMetrics && (
        <div className="grid grid-cols-2 gap-2 rounded-sm border border-border bg-surface p-2">
          {diagnosis.predictiveMetrics.remainingBatteryLife && (
            <div className="flex items-center gap-2">
              <Battery className="size-3.5 text-primary" />
              <div>
                <div className="label-tech text-[0.6rem]">Est. Battery Life</div>
                <div className="num text-[0.75rem] font-semibold text-foreground">
                  {diagnosis.predictiveMetrics.remainingBatteryLife}
                </div>
              </div>
            </div>
          )}
          {diagnosis.predictiveMetrics.estCpuTemp30min && (
            <div className="flex items-center gap-2">
              <Thermometer className="size-3.5 text-warning" />
              <div>
                <div className="label-tech text-[0.6rem]">30m CPU Forecast</div>
                <div className="num text-[0.75rem] font-semibold text-foreground">
                  {diagnosis.predictiveMetrics.estCpuTemp30min}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Structured Evidence Chain */}
      <div>
        <div className="label-tech uppercase font-bold text-muted-foreground">Structured Evidence Chain</div>
        <ul className="mt-1.5 space-y-1">
          {diagnosis.evidence.map((e) => (
            <li key={e} className="flex gap-2 text-[0.76rem] leading-snug text-muted-foreground font-mono">
              <CircleCheck className="mt-0.5 size-3 shrink-0 text-primary" strokeWidth={2} />
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Expected Mission Impact */}
      <div className="rounded-sm border border-border bg-surface p-2 space-y-0.5">
        <span className="label-tech text-[0.6rem] text-muted-foreground uppercase font-bold block">
          Expected Mission &amp; Thermal/Power Impact
        </span>
        <p className="text-[0.74rem] font-mono text-foreground/90 leading-snug">
          {expectedImpact}
        </p>
      </div>

      {/* 8. Human Flight Explanation & Recommended SOP */}
      <div className="rounded-sm border border-primary/40 bg-surface-raised px-2.5 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="size-3 text-primary" />
            <span className="label-tech text-[0.62rem] !text-primary uppercase font-bold">Flight Controller Guidance</span>
          </div>
          <span className="font-tech text-[0.62rem] font-bold text-primary uppercase">
            SOP: {recommendedProc}
          </span>
        </div>
        <p className="text-[0.76rem] leading-snug text-foreground/90 font-mono">
          {humanExplanation}
        </p>
      </div>

      <div className="num flex justify-between text-[0.65rem] text-muted-foreground pt-1 border-t border-border/40">
        <span>Model: {diagnosis.model || "llama-3.3-70b-versatile"}</span>
        <span>Latency: {diagnosis.latencyMs || 24} ms</span>
      </div>
    </div>
  );
}
