import React from "react";
import ReactDOM from "react-dom/client";
import { TopBar } from "./components/smoa/TopBar";
import ConstellationDashboard from "./components/smoa/ConstellationDashboard";
import { useTelemetry } from "./lib/smoa/useTelemetry";
import "./styles.css";


function ConstellationApp() {
  const { status, history, latest, events } = useTelemetry([]);

  const isLiveAnomaly = (latest?.anomalyScore !== undefined && latest.anomalyScore > 0.5) || (latest?.power?.busVoltage !== undefined && latest.power.busVoltage < 21.0);
  const activeEvents = events?.filter((e) => !e.resolved && (Date.now() - e.ts) < 30000) ?? [];
  const anomalyCount = isLiveAnomaly ? 1 : activeEvents.length;
  const criticalCount = (latest?.power?.busVoltage !== undefined && latest.power.busVoltage < 21.0) ? 1 : activeEvents.filter((e) => e.severity === "critical").length;


  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-background">
      <TopBar
        status={status}
        met={latest?.met ?? null}
        anomalyCount={anomalyCount}
        criticalCount={criticalCount}
        anomalyScore={latest?.anomalyScore}
        showNav={false}
      />

      <main className="flex-1 min-h-0 p-2 overflow-hidden">
        <ConstellationDashboard latest={latest} history={history} status={status} events={events} />
      </main>
    </div>
  );
}


const rootElement = document.getElementById("constellation-root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ConstellationApp />
    </React.StrictMode>
  );
}
