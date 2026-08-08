import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/smoa/TopBar";
import { useTelemetry } from "@/lib/smoa/useTelemetry";
import { SeedingDashboard } from "@/components/seeding/SeedingDashboard";

export const Route = createFileRoute("/seeding")({
  head: () => ({
    meta: [
      { title: "ORION AI — Telemetry Data Seeding Controller" },
      { name: "description", content: "Data seeding and fault injection controller." },
    ],
  }),
  component: SeedingPage,
});

function SeedingPage() {
  const { status, latest } = useTelemetry([]);

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-background">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={0}
        criticalCount={0}
        anomalyScore={latest?.anomalyScore}
      />
      <main className="flex-1 min-h-0 overflow-auto p-2">
        <SeedingDashboard />
      </main>
    </div>
  );
}
