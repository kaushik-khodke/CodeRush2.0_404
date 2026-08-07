import { motion } from "framer-motion";
import { CircleCheck, CircleDot, TriangleAlert } from "lucide-react";
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
        <span className="label-tech">Diagnostic trace pending — Grok analysis in progress</span>
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
