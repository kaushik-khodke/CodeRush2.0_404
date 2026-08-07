import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, WifiOff } from "lucide-react";
import { TopBar } from "@/components/smoa/TopBar";
import { TelemetryPanel } from "@/components/smoa/TelemetryPanel";
import { AttitudeViewer } from "@/components/smoa/AttitudeViewer";
import { EventFeed } from "@/components/smoa/EventFeed";
import { ApprovalQueue } from "@/components/smoa/ApprovalQueue";
import { FaultInjectionPanel } from "@/components/smoa/FaultInjectionPanel";
import { authorizeCommand, fetchEvents, fetchPendingCommands, formatClock } from "@/lib/smoa/api";
import { useTelemetry } from "@/lib/smoa/useTelemetry";
import type { AnomalyEvent, FaultInjection, PendingCommand } from "@/lib/smoa/types";
import { mockAgents } from "@/lib/smoa/mock";
import { AgentRoster } from "@/components/smoa/AgentRoster";

const title = "ORION AI — Mission Operations Control";
const description =
  "Live spacecraft telemetry, ML Sentinel anomaly diagnoses, and human-authorized flight commanding in one operator console.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OperationsConsole,
});

function OperationsConsole() {
  const [faults, setFaults] = useState<FaultInjection[]>([]);
  const { status, history, latest, lastError } = useTelemetry(faults);
  const [agents] = useState(() => mockAgents());
  const [selectedAgentId, setSelectedAgentId] = useState("telemetry_monitor");

  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [commands, setCommands] = useState<PendingCommand[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(true);
  const [commandsError, setCommandsError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEvents = useCallback(() => {
    setEventsLoading(true);
    setEventsError(null);
    fetchEvents()
      .then((e) => setEvents(e.sort((a, b) => b.ts - a.ts)))
      .catch(() => setEventsError("Unable to reach /api/events. Anomaly feed is stale."))
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    loadEvents();
    fetchPendingCommands()
      .then(setCommands)
      .catch(() => setCommandsError("Unable to reach /api/commands/pending."))
      .finally(() => setCommandsLoading(false));
  }, [loadEvents]);

  const onDecide = useCallback((id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    authorizeCommand(id, decision)
      .then((res) => setCommands((prev) => prev.map((c) => (c.id === id ? { ...c, state: res.state } : c))))
      .catch(() => setCommandsError(`Authorization for ${id} failed to transmit. Command left pending.`))
      .finally(() => setBusyId(null));
  }, []);

  const anomalyCount = useMemo(() => events.filter((e) => e.severity !== "info").length, [events]);
  const criticalCount = useMemo(() => events.filter((e) => e.severity === "critical").length, [events]);

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-background">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={anomalyCount}
        criticalCount={criticalCount}
        anomalyScore={latest?.anomalyScore}
      />


      {(status === "degraded" || status === "disconnected" || lastError) && (
        <div
          className={`flex items-center gap-2 border-b px-4 py-1.5 ${
            status === "disconnected"
              ? "border-critical/50 bg-critical/12 text-critical"
              : "border-warning/40 bg-warning/10 text-warning"
          }`}
        >
          {status === "disconnected" ? <WifiOff className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          <span className="text-[0.75rem]">
            {lastError ?? "Telemetry link lost. Displayed values are not live."}
          </span>
          <span className="num ml-auto text-[0.7rem] opacity-80">
            last frame {latest ? formatClock(latest.t) : "—"}
          </span>
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-[20rem_22rem_minmax(0,1fr)_24rem] gap-2 p-2">
        <AgentRoster agents={agents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />
        <TelemetryPanel frames={history} status={status} />
        <AttitudeViewer latest={latest} status={status} />
        <EventFeed events={events} loading={eventsLoading} error={eventsError} onRetry={loadEvents} />
      </main>

      <div className="px-2 pb-2">
        <ApprovalQueue
          commands={commands}
          loading={commandsLoading}
          error={commandsError}
          busyId={busyId}
          onDecide={onDecide}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-1.5">
        <span className="label-tech">Console UTC {latest ? formatClock(latest.t) : "--:--:--"}</span>
        <span className="label-tech">Buffer {history.length}/300 frames</span>
        <div className="ml-auto">
          <FaultInjectionPanel faults={faults} onChange={setFaults} />
        </div>
      </div>
    </div>
  );
}
