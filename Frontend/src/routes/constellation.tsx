import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/smoa/TopBar";
import { useTelemetry } from "@/lib/smoa/useTelemetry";
import ConstellationDashboard from "@/components/smoa/ConstellationDashboard";

export const Route = createFileRoute("/constellation")({
  head: () => ({
    meta: [
      { title: "ORION AI — Constellation Operations" },
      { name: "description", content: "Dynamic orbits, contacts, and telemetry status for the ORION AI constellation." },
    ],
  }),
  component: ConstellationPage,
});

function ConstellationPage() {
  const { status, history, latest } = useTelemetry([]);

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-background">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={0}
        criticalCount={0}
        anomalyScore={latest?.anomalyScore}
      />
      <main className="flex-1 min-h-0 p-2 overflow-hidden">
        <ConstellationDashboard latest={latest} history={history} status={status} />
      </main>
    </div>
  );
}
