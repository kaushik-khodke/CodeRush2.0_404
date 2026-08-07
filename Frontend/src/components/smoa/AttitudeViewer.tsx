import { Suspense, lazy, useEffect, useRef } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import type { LinkStatus, TelemetryFrame } from "@/lib/smoa/types";

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

  useEffect(() => {
    if (!latest) return;
    attitude.current = latest.adcs;
    orbitAngle.current = latest.orbitAngle;
  }, [latest]);

  const f = (n: number | undefined, d = 2) => (n === undefined ? "––.–" : n.toFixed(d));

  return (
    <section className="panel flex min-h-0 flex-col">
      <div className="panel-header">
        <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">
          Spacecraft Attitude · Body Frame
        </h3>
        <span className="label-tech">
          {latest?.eclipse ? "Eclipse" : "Insolation"} · {f(latest?.orbitAngle, 1)}° true anomaly
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <ClientOnly fallback={<SceneFallback message="Initialising attitude viewer…" />}>
          <Suspense fallback={<SceneFallback message="Loading spacecraft model…" />}>
            <AttitudeScene attitude={attitude} orbitAngle={orbitAngle} />
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
