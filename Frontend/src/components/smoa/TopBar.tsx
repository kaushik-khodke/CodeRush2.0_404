import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Cpu, Radio, Satellite } from "lucide-react";
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
  anomalyScore?: number | undefined;
  onToggleAgents?: () => void;
  onToggleTelemetrySource?: () => void;
  agentsOpen?: boolean;
  showNav?: boolean;
  telemetrySource?: "simulator" | "digital-twin";
}

export function TopBar({
  status,
  met,
  anomalyCount,
  criticalCount,
  anomalyScore,
  onToggleAgents,
  onToggleTelemetrySource,
  agentsOpen,
  showNav = true,
  telemetrySource = "digital-twin",
}: TopBarProps) {
  const meta = statusMeta[status];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-13 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-surface-raised/50 p-1">
          <img src="/favicon-removebg-preview.png" alt="ORION AI Logo" className="size-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-tech text-sm font-semibold tracking-[0.14em] uppercase">
            ORION AI
          </div>
          <div className="label-tech">AI Mission-Control Copilot</div>
        </div>
      </div>

      <nav className="flex items-center gap-2">
        {onToggleAgents && (
          <button
            onClick={onToggleAgents}
            className={cn(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-tech text-[0.7rem] font-semibold tracking-[0.1em] uppercase transition-colors duration-150 border cursor-pointer",
              agentsOpen
                ? "bg-primary/20 text-primary border-primary"
                : "border-border bg-surface-raised/40 text-muted-foreground hover:bg-surface-raised hover:text-foreground",
            )}
          >
            <Cpu className="size-3.5 text-primary" />
            Control Room (9 Nodes)
          </button>
        )}

        {showNav &&
          [
            { to: "/", label: "Operations" },
            { to: "/planner", label: "Mission Planner" },
            { to: "/replay", label: "Digital Twin Replay" },
            { to: "/seeding", label: "Data Seeding" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-sm px-2.5 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase transition-colors duration-150 hover:bg-surface-raised hover:text-foreground [&.active]:bg-surface-raised [&.active]:text-primary"
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

        <button
          onClick={onToggleTelemetrySource}
          title="Click to toggle backend runtime telemetry feed (BSK Digital Twin vs Local Simulator)"
          className={cn(
            "flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 transition-all duration-200 cursor-pointer hover:scale-102",
            telemetrySource === "digital-twin"
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-amber-500/40 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40"
          )}
        >
          <Satellite className="size-3.5" />
          <span className="font-tech text-[0.68rem] font-bold tracking-[0.08em] uppercase">
            {telemetrySource === "digital-twin" ? "BSK Twin Active" : "Local Simulator Active"}
          </span>
        </button>


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

