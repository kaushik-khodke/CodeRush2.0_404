import { motion } from "framer-motion";
import { Battery, CircleCheck, CircleDot, ShieldAlert, Thermometer, TriangleAlert } from "lucide-react";
import type { Diagnosis } from "@/lib/smoa/types";

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
      <span className="num text-xs text-foreground">{pct}%</span>
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

  return (
    <div className="space-y-3 border-t border-border bg-background/40 px-3 py-3">
      <div>
        <div className="label-tech">Root cause</div>
        <p className="mt-1 text-[0.8rem] leading-relaxed text-foreground/90">{diagnosis.rootCause}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="label-tech">Confidence</span>
        <ConfidenceBar value={diagnosis.confidence} />
      </div>

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

      <div>
        <div className="label-tech">Evidence chain</div>
        <ul className="mt-1.5 space-y-1">
          {diagnosis.evidence.map((e) => (
            <li key={e} className="flex gap-2 text-[0.775rem] leading-snug text-muted-foreground">
              <CircleCheck className="mt-0.5 size-3 shrink-0 text-primary" strokeWidth={2} />
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <TriangleAlert className="size-3 text-primary" />
          <span className="label-tech !text-primary">Proposed action</span>
        </div>
        <p className="mt-1 text-[0.8rem] leading-snug text-foreground/90">{diagnosis.proposedAction}</p>
      </div>

      <div className="num flex justify-between text-[0.65rem] text-muted-foreground">
        <span>{diagnosis.model}</span>
        <span>{diagnosis.latencyMs} ms</span>
      </div>
    </div>
  );
}

