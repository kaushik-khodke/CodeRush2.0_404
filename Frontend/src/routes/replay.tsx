import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleUser, History, Play, Pause, RotateCcw } from "lucide-react";
import { ReplayTimeline } from "@/components/smoa/ReplayTimeline";
import { TelemetryPanel } from "@/components/smoa/TelemetryPanel";
import { AttitudeViewer } from "@/components/smoa/AttitudeViewer";
import { DiagnosisCard } from "@/components/smoa/DiagnosisCard";
import { TopBar } from "@/components/smoa/TopBar";
import { mockIncident } from "@/lib/smoa/mock";
import { cn } from "@/lib/utils";

const title = "ORION AI — Digital Twin Replay";
const description =
  "Scrub a historical incident with telemetry playback synced to the original anomaly flag, diagnosis, and operator decision.";

export const Route = createFileRoute("/replay")({
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
  component: ReplayPage,
});

function ReplayPage() {
  const [incident, setIncident] = useState(() => mockIncident());
  const [index, setIndex] = useState(0);

  // Pre-warm initial frames (min 20 frames) so Chart.js immediately plots line waveforms at t=0
  const frames = useMemo(
    () => incident.frames.slice(0, Math.max(20, index + 1)),
    [incident, index]
  );
  const latest = frames[frames.length - 1] ?? null;

  const flagged = index >= incident.flagAtSecond;
  const decided = index >= incident.operatorDecision.decidedAtSecond;

  // Attempt to load real telemetry records from backend API /replay endpoint
  useEffect(() => {
    fetch("/replay?limit=300")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.telemetry_records) && data.telemetry_records.length >= 20) {
          // Map backend telemetry records into ReplayIncident frames
          const mappedFrames = data.telemetry_records.map((r: any, idx: number) => ({
            met: 128400 + idx,
            t: new Date(r.timestamp || Date.now()).getTime(),
            orbitAngle: (idx / 300) * 360,
            eclipse: idx > 140 && idx < 240,
            power: {
              busVoltage: r.bus_voltage ?? 27.6,
              stateOfCharge: r.battery_soc ?? 78.4,
              arrayPower: r.solar_array_power ?? 412.0,
            },
            thermal: {
              batteryTemp: r.battery_temp ?? 18.2,
              payloadTemp: r.payload_temp ?? -6.4,
              radiatorTemp: -31.5,
            },
            adcs: {
              roll: r.roll ?? 0,
              pitch: r.pitch ?? 0,
              yaw: r.yaw ?? 0,
              bodyRate: r.angular_velocity ?? 0.32,
              wheelRpm: r.reaction_wheel_speed ?? 2840,
            },
            comms: {
              signalDbm: -92.4,
              packetLoss: 0.4,
              rttSeconds: 0.42,
            },
          }));

          setIncident((prev) => ({
            ...prev,
            durationSeconds: mappedFrames.length,
            frames: mappedFrames,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen min-w-[1280px] bg-background text-foreground overflow-y-auto">
      <TopBar status="live" met={latest?.met ?? null} anomalyCount={1} criticalCount={1} />

      <div className="flex items-center justify-between border-b border-primary/40 bg-primary/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <span className="font-tech text-xs font-bold text-primary uppercase">
            Digital Twin Incident Replay: {incident.id} — {incident.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="num text-xs text-primary/80">
            {new Date(incident.startedAt || Date.now()).toISOString().replace("T", " ").slice(0, 19)}Z
          </span>
        </div>
      </div>

      {/* Main 3-Column Telemetry & 3D Twin Replay Grid */}
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)_24rem] gap-4 p-4 items-start">
        <TelemetryPanel frames={frames} status="live" />
        <AttitudeViewer latest={latest} status="live" />

        <div className="flex flex-col gap-3 h-[540px] overflow-y-auto scroll-thin pr-1">
          <section
            className={cn(
              "panel transition-all duration-200 border-l-2",
              flagged ? "opacity-100 border-l-warning" : "opacity-50 border-l-border"
            )}
          >
            <div className="panel-header">
              <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Anomaly Flag</h3>
              <span className="num text-[0.7rem] text-muted-foreground">T+{incident.flagAtSecond}s</span>
            </div>
            {flagged ? (
              <>
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="num text-[0.7rem] text-muted-foreground">{incident.event.id}</span>
                    <span className="rounded-sm border border-critical/60 bg-critical/15 px-1.5 py-px font-tech text-[0.6rem] font-semibold tracking-[0.08em] text-critical uppercase">
                      {incident.event.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.82rem] leading-snug font-medium text-foreground">{incident.event.title}</p>
                  <p className="label-tech mt-1">{incident.event.detector}</p>
                </div>
                <DiagnosisCard diagnosis={incident.event.diagnosis} />
              </>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground font-tech">
                Nominal — anomaly fires at T+{incident.flagAtSecond}s. Click ▶ PLAY at bottom timeline.
              </p>
            )}
          </section>

          <section
            className={cn(
              "panel transition-all duration-200 border-l-2",
              decided ? "opacity-100 border-l-nominal" : "opacity-50 border-l-border"
            )}
          >
            <div className="panel-header">
              <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Operator Decision</h3>
              <span className="num text-[0.7rem] text-muted-foreground">
                T+{incident.operatorDecision.decidedAtSecond}s
              </span>
            </div>
            {decided ? (
              <div className="space-y-2 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <CircleUser className="size-3.5 text-primary" />
                  <span className="font-tech text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
                    {incident.operatorDecision.operator}
                  </span>
                </div>
                <p className="num text-[0.8rem] font-semibold text-nominal">{incident.operatorDecision.action}</p>
                <p className="text-[0.78rem] leading-snug text-muted-foreground">
                  {incident.operatorDecision.outcome}
                </p>
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground font-tech">
                Awaiting operator authorization in replay sequence
              </p>
            )}
          </section>
        </div>
      </main>

      {/* Replay Timeline Controls */}
      <div className="p-4 border-t border-border bg-surface/40">
        <ReplayTimeline incident={incident} index={index} onIndexChange={setIndex} />
      </div>
    </div>
  );
}
