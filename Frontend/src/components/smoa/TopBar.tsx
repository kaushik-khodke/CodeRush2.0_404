import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Radio, Satellite } from "lucide-react";
import { formatMet } from "@/lib/smoa/api";
import type { LinkStatus } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

const statusMeta: Record<LinkStatus, { label: string; dot: string; text: string }> = {
  connecting: { label: "Acquiring link", dot: "bg-warning", text: "text-warning" },
  live: { label: "Link nominal", dot: "bg-nominal", text: "text-nominal" },
  degraded: { label: "Simulated feed", dot: "bg-warning", text: "text-warning" },
  disconnected: { label: "Link lost", dot: "bg-critical", text: "text-critical" },
};

interface TopBarProps {
  status: LinkStatus;
  met: number | null;
  anomalyCount: number;
  criticalCount: number;
  anomalyScore?: number;
}

export function TopBar({ status, met, anomalyCount, criticalCount, anomalyScore }: TopBarProps) {
  const meta = statusMeta[status];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-13 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-surface-raised/50 p-1">
          <img src="/favicon-removebg-preview.png" alt="SMOA Logo" className="size-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-tech text-sm font-semibold tracking-[0.14em] uppercase">
            SMOA · Helios-3
          </div>
          <div className="label-tech">Space Mission Operations Automator</div>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {[
          { to: "/", label: "Operations" },
          { to: "/replay", label: "Digital Twin Replay" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="rounded-sm px-3 py-1.5 font-tech text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase transition-colors duration-150 hover:bg-surface-raised hover:text-foreground"
            activeProps={{ className: "bg-surface-raised !text-foreground" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <div className="label-tech">MET (ddd:hh:mm:ss)</div>
          <div className="num text-sm text-foreground">{met === null ? "---:--:--:--" : formatMet(met)}</div>
        </div>

        {anomalyScore !== undefined && (
          <div className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5">
            <span className="label-tech text-[0.65rem]">ML Sentinel</span>
            <span
              className={cn(
                "num text-xs font-semibold",
                anomalyScore > 0.6 ? "text-critical" : anomalyScore > 0.3 ? "text-warning" : "text-nominal",
              )}
            >
              {anomalyScore.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1.5">
          <span className="relative flex size-2">
            {status !== "disconnected" && (
              <motion.span
                className={cn("absolute inline-flex size-2 rounded-full opacity-60", meta.dot)}
                animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span className={cn("relative inline-flex size-2 rounded-full", meta.dot)} />
          </span>
          <span className={cn("font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase", meta.text)}>
            {meta.label}
          </span>
          <Radio className="size-3 text-muted-foreground" />
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-sm border px-2.5 py-1.5",
            criticalCount > 0
              ? "border-critical/60 bg-critical/15 text-critical"
              : anomalyCount > 0
                ? "border-warning/50 bg-warning/12 text-warning"
                : "border-border bg-background text-muted-foreground",
          )}
        >
          <AlertTriangle className="size-3.5" strokeWidth={2} />
          <span className="num text-sm font-semibold">{String(anomalyCount).padStart(2, "0")}</span>
          <span className="font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase">Anomalies</span>
        </div>
      </div>
    </header>
  );
}

