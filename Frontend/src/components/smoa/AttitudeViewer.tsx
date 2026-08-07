import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Compass, Eye, Flame, Sun } from "lucide-react";
import type { LinkStatus, TelemetryFrame } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

// three.js touches WebGL at import time — keep it out of the SSR graph.
const AttitudeScene = lazy(() => import("./AttitudeScene"));

function SceneFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="text-center">
        <Compass className="mx-auto size-6 animate-pulse text-primary" strokeWidth={1.5} />
        <p className="label-tech mt-2">{message}</p>
      </div>
    </div>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-surface px-2.5 py-2">
      <div className="label-tech">{label}</div>
      <div className="num mt-1 text-[0.95rem] leading-none">
        {value}
        <span className="ml-1 text-[0.65rem] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function AttitudeViewer({ latest, status }: { latest: TelemetryFrame | null; status: LinkStatus }) {
  const attitude = useRef(latest?.adcs ?? { roll: 0, pitch: 0, yaw: 0, bodyRate: 0, wheelRpm: 0 });
  const orbitAngle = useRef(latest?.orbitAngle ?? 0);

  // Digital Twin Overlay Toggles
  const [showSunVector, setShowSunVector] = useState(true);
  const [showSensorCone, setShowSensorCone] = useState(true);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState(false);

  useEffect(() => {
    if (!latest) return;
    attitude.current = latest.adcs;
    orbitAngle.current = latest.orbitAngle;
  }, [latest]);

  const f = (n: number | undefined, d = 2) => (n === undefined ? "––.–" : n.toFixed(d));
  const cpuTemp = latest?.thermal?.payloadTemp ?? 35.0;

  return (
    <section className="panel flex flex-col h-[540px]">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">
            3D Digital Twin · Spacecraft Body &amp; Orbit
          </h3>
          <span className="rounded-sm border border-primary/50 bg-primary/10 px-1.5 py-px font-tech text-[0.6rem] font-semibold text-primary uppercase">
            BSK Engine
          </span>
        </div>

        {/* Overlay Toggle Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSunVector((v) => !v)}
            title="Toggle Solar Illumination Vector"
            className={cn(
              "p-1 rounded-sm border transition-colors cursor-pointer",
              showSunVector
                ? "border-warning/60 bg-warning/15 text-warning"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="size-3.5" />
          </button>

          <button
            onClick={() => setShowSensorCone((v) => !v)}
            title="Toggle Payload Boresight Footprint Cone"
            className={cn(
              "p-1 rounded-sm border transition-colors cursor-pointer",
              showSensorCone
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="size-3.5" />
          </button>

          <button
            onClick={() => setShowThermalHeatmap((v) => !v)}
            title="Toggle Thermal Deck Heatmap Mesh Mode"
            className={cn(
              "p-1 rounded-sm border transition-colors cursor-pointer",
              showThermalHeatmap
                ? "border-critical/60 bg-critical/15 text-critical"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <ClientOnly fallback={<SceneFallback message="Initialising digital twin..." />}>
          <Suspense fallback={<SceneFallback message="Loading 3D model..." />}>
            <AttitudeScene
              attitude={attitude}
              orbitAngle={orbitAngle}
              showSunVector={showSunVector}
              showSensorCone={showSensorCone}
              showThermalHeatmap={showThermalHeatmap}
              cpuTemp={cpuTemp}
            />
          </Suspense>
        </ClientOnly>

        {status === "disconnected" && (
          <div className="absolute inset-x-0 top-0 bg-critical/85 py-1 text-center">
            <span className="font-tech text-[0.7rem] font-semibold tracking-[0.1em] text-critical-foreground uppercase">
              Attitude frozen — no telemetry
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-px border-t border-border bg-border">
        <Readout label="Roll" value={f(latest?.adcs.roll)} unit="°" />
        <Readout label="Pitch" value={f(latest?.adcs.pitch)} unit="°" />
        <Readout label="Yaw" value={f(latest?.adcs.yaw)} unit="°" />
        <Readout label="Body rate" value={f(latest?.adcs.bodyRate, 3)} unit="°/s" />
        <Readout label="RW3 speed" value={f(latest?.adcs.wheelRpm, 0)} unit="RPM" />
      </div>
    </section>
  );
}
