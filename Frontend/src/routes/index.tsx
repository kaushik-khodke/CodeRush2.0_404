import { useCallback, useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, WifiOff } from "lucide-react";
import { TopBar } from "@/components/smoa/TopBar";
import { TelemetryPanel } from "@/components/smoa/TelemetryPanel";
import { AttitudeViewer } from "@/components/smoa/AttitudeViewer";
import { EventFeed } from "@/components/smoa/EventFeed";
import { ApprovalQueue } from "@/components/smoa/ApprovalQueue";
import { authorizeCommand, fetchEvents, fetchPendingCommands, formatClock, setTelemetrySourceApi } from "@/lib/smoa/api";
import { useTelemetry } from "@/lib/smoa/useTelemetry";
import type { AnomalyEvent, FaultInjection, PendingCommand } from "@/lib/smoa/types";
import { mockAgents } from "@/lib/smoa/mock";
import { AgentRoster } from "@/components/smoa/AgentRoster";
import { MultiAgentConsensusPanel } from "@/components/smoa/MultiAgentConsensusPanel";

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
  const [agents] = useState(() => mockAgents());
  const [selectedAgentId, setSelectedAgentId] = useState("telemetry_monitor");
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(false);
  const [telemetrySource, setTelemetrySource] = useState<"simulator" | "digital-twin">("simulator");

  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [commands, setCommands] = useState<PendingCommand[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(true);
  const [commandsError, setCommandsError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { status, history, latest, lastError } = useTelemetry(faults, telemetrySource);

  const loadEvents = useCallback((silent = false) => {
    if (!silent) setEventsLoading(true);
    setEventsError(null);
    fetchEvents()
      .then((e) => setEvents(e.sort((a, b) => b.ts - a.ts)))
      .catch(() => setEventsError("Unable to reach /api/events. Anomaly feed is stale."))
      .finally(() => setEventsLoading(false));
  }, []);

  const loadCommands = useCallback((silent = false) => {
    if (!silent) setCommandsLoading(true);
    fetchPendingCommands()
      .then(setCommands)
      .catch(() => setCommandsError("Unable to reach /api/commands/pending."))
      .finally(() => setCommandsLoading(false));
  }, []);

  useEffect(() => {
    loadEvents(false);
    loadCommands(false);

    const interval = setInterval(() => {
      loadEvents(true);
      loadCommands(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [loadEvents, loadCommands]);

  const onDecide = useCallback(
    (id: string, decision: "approve" | "reject") => {
      setBusyId(id);
      const targetCmd = commands.find((c) => c.id === id);
      authorizeCommand(id, decision)
        .then(() => {
          setCommands((prev) =>
            prev.filter(
              (c) =>
                c.id !== id &&
                c.command !== targetCmd?.command &&
                c.subsystem !== targetCmd?.subsystem
            )
          );
          if (targetCmd) {
            setEvents((prev) =>
              prev.filter((e) => e.id !== targetCmd.linkedEventId && e.subsystem !== targetCmd.subsystem)
            );
          }
          loadEvents(true);
          loadCommands(true);
        })
        .catch(() => setCommandsError(`Authorization for ${id} failed to transmit. Command left pending.`))
        .finally(() => setBusyId(null));
    },
    [commands, loadEvents, loadCommands]
  );

  const anomalyCount = useMemo(() => events.filter((e) => e.severity !== "info").length, [events]);
  const criticalCount = useMemo(() => events.filter((e) => e.severity === "critical").length, [events]);

  const handleSourceSwitch = useCallback((newSource: "simulator" | "digital-twin") => {
    setTelemetrySource(newSource);
    setTelemetrySourceApi(newSource);
  }, []);

  return (
    <div className="min-h-screen min-w-[1280px] flex flex-col bg-background text-foreground overflow-y-auto">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={anomalyCount}
        criticalCount={criticalCount}
        anomalyScore={latest?.anomalyScore ?? 0.08}
        onToggleAgents={() => setAgentSidebarOpen((prev) => !prev)}
        onToggleTelemetrySource={() => handleSourceSwitch(telemetrySource === "digital-twin" ? "simulator" : "digital-twin")}
        agentsOpen={agentSidebarOpen}
        telemetrySource={telemetrySource}
      />


      {/* Control Room Agent Roster Sidebar Drawer */}
      <AnimatePresence>
        {agentSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setAgentSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: -360 }}
              animate={{ x: 0 }}
              exit={{ x: -360 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[23rem] flex-col border-r border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-3">
                <span className="font-tech text-xs font-semibold uppercase tracking-wider text-primary">
                  Control Room Agent Nodes
                </span>
                <button
                  onClick={() => setAgentSidebarOpen(false)}
                  className="rounded-sm border border-border px-2 py-0.5 font-tech text-[0.7rem] text-muted-foreground hover:text-foreground"
                >
                  Close ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <AgentRoster agents={agents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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

      {/* Main Spacious Telemetry, 3D Twin & Event Grid */}
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)_24rem] gap-4 p-4 items-start">
        <TelemetryPanel frames={history} status={status} />
        <AttitudeViewer latest={latest} status={status} />
        <EventFeed events={events} loading={eventsLoading} error={eventsError} onRetry={loadEvents} />
      </main>

      {/* Multi-Agent AI Consensus Engine & Telemetry Plan Advisory Section */}
      <section className="px-4 pt-4">
        <MultiAgentConsensusPanel latest={latest} events={events} commands={commands} />
      </section>

      {/* Human Approval Queue Section */}
      <section className="px-4 py-4 bg-surface/30">
        <ApprovalQueue
          commands={commands}
          loading={commandsLoading}
          error={commandsError}
          busyId={busyId}
          onDecide={onDecide}
        />
      </section>

      {/* Status Footer */}
      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-2 mt-auto">
        <span className="label-tech">Console UTC {latest ? formatClock(latest.t) : "--:--:--"}</span>
        <span className="label-tech">Buffer {history.length}/300 frames</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[0.75rem] text-muted-foreground">Simulation mode</span>
          <Select value={telemetrySource} onValueChange={(value) => handleSourceSwitch(value as "simulator" | "digital-twin")}>
            <SelectTrigger className="h-8 w-[170px] border-border bg-background text-[0.75rem]">
              <SelectValue placeholder="Telemetry source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simulator">Simulator</SelectItem>
              <SelectItem value="digital-twin">Digital Twin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

    </div>
  );
}
