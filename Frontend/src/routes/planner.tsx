import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { TopBar } from "@/components/smoa/TopBar";
import { MissionPlanner } from "@/components/smoa/MissionPlanner";
import { AgentRoster } from "@/components/smoa/AgentRoster";
import { mockAgents } from "@/lib/smoa/mock";
import { useTelemetry } from "@/lib/smoa/useTelemetry";

const title = "ORION AI — Mission Activity & Resource Planner";
const description =
  "Automated mission timeline scheduling, resource constraint verification, and AI solver precedence reasoning.";

export const Route = createFileRoute("/planner")({
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
  component: PlannerPage,
});

function PlannerPage() {
  const { status, latest } = useTelemetry([]);
  const [agents] = useState(() => mockAgents());
  const [selectedAgentId, setSelectedAgentId] = useState("mission_planner");
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen min-w-[1280px] flex flex-col bg-background text-foreground overflow-y-auto">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={0}
        criticalCount={0}
        anomalyScore={latest?.anomalyScore ?? 0.08}
        onToggleAgents={() => setAgentSidebarOpen((prev) => !prev)}
        agentsOpen={agentSidebarOpen}
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

      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto">
        <MissionPlanner />
      </main>

      <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-2 mt-auto">
        <span className="label-tech">SMOA Mission &amp; Resource Planner v2.0</span>
        <span className="label-tech">LEO Sun-Synchronous Orbit 520km</span>
      </footer>
    </div>
  );
}
