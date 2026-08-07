import React from "react";
import ReactDOM from "react-dom/client";
import { TopBar } from "./components/smoa/TopBar";
import ConstellationDashboard from "./components/smoa/ConstellationDashboard";
import { useTelemetry } from "./lib/smoa/useTelemetry";
import "./styles.css";


function ConstellationApp() {
  const { status, history, latest, events } = useTelemetry([]);

  const anomalyCount = (events?.length ?? 0) > 0 ? events.length : (latest?.anomalyScore && latest.anomalyScore > 0.5 ? 1 : 0);
  const criticalCount = events?.filter((e) => e.severity === "critical").length ?? (latest?.power?.busVoltage && latest.power.busVoltage < 21.0 ? 1 : 0);

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
