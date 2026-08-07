import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Inbox, RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/smoa/api";
import type { AnomalyEvent, Severity } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";
import { DiagnosisCard } from "./DiagnosisCard";

const severityStyles: Record<Severity, { bar: string; chip: string }> = {
  critical: { bar: "bg-critical", chip: "border-critical/60 bg-critical/15 text-critical" },
  warning: { bar: "bg-warning", chip: "border-warning/50 bg-warning/12 text-warning" },
  info: { bar: "bg-muted-foreground", chip: "border-border bg-background text-muted-foreground" },
};

export function EventFeed({
  events,
  loading,
  error,
  onRetry,
}: {
  events: AnomalyEvent[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="panel flex flex-col h-[540px]">
      <div className="panel-header">
        <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Event &amp; Diagnosis Feed</h3>
        <span className="label-tech">ML Sentinel · reverse chron</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin pr-1">
        {loading && (
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse border-b border-border px-3 py-4">
                <div className="h-2 w-24 rounded-sm bg-surface-raised" />
                <div className="mt-2 h-3 w-full rounded-sm bg-surface-raised" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-4 text-center">
            <p className="text-[0.8rem] text-critical">{error}</p>
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2.5 py-1.5 font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase transition-colors duration-150 hover:border-border-strong"
            >
              <RefreshCw className="size-3" /> Retry /api/events
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <Inbox className="size-5 text-muted-foreground" />
            <p className="label-tech">No anomalies flagged this shift</p>
          </div>
        )}

        {!loading &&
          !error &&
          events.map((e) => {
            const s = severityStyles[e.severity];
            const isOpen = open === e.id;
            return (
              <article key={e.id} className="border-b border-border">
                <button
                  onClick={() => setOpen(isOpen ? null : e.id)}
                  className="flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-raised"
                >
                  <span className={cn("mt-0.5 w-0.5 shrink-0 self-stretch rounded-full", s.bar)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="num text-[0.7rem] text-muted-foreground">{e.id}</span>
                      <span
                        className={cn(
                          "rounded-sm border px-1.5 py-px font-tech text-[0.6rem] font-semibold tracking-[0.08em] uppercase",
                          s.chip,
                        )}
                      >
                        {e.severity}
                      </span>
                      <span className="label-tech">{e.subsystem}</span>
                      <span className="num ml-auto text-[0.65rem] text-muted-foreground">{timeAgo(e.ts)}</span>
                    </span>
                    <span className="mt-1 block text-[0.82rem] leading-snug font-medium text-foreground">
                      {e.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="label-tech truncate">{e.detector}</span>
                      <span className="num ml-auto text-[0.65rem] text-muted-foreground">
                        score {e.score.toFixed(2)}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <DiagnosisCard diagnosis={e.diagnosis} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
      </div>
    </section>
  );
}
