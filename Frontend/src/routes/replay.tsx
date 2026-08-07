import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleUser, History } from "lucide-react";
import { ReplayTimeline } from "@/components/smoa/ReplayTimeline";
import { TelemetryPanel } from "@/components/smoa/TelemetryPanel";
import { AttitudeViewer } from "@/components/smoa/AttitudeViewer";
import { DiagnosisCard } from "@/components/smoa/DiagnosisCard";
import { TopBar } from "@/components/smoa/TopBar";
import { mockIncident } from "@/lib/smoa/mock";
import { cn } from "@/lib/utils";

const title = "Digital Twin Replay — SMOA Mission Control";
const description =
  "Scrub a historical Helios-3 incident with telemetry playback synced to the original anomaly flag, diagnosis, and operator decision.";

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
  // TODO(backend): fetch the incident archive from Supabase (/api/incidents/:id).
  const [incident] = useState(() => mockIncident());
  const [index, setIndex] = useState(0);

  const frames = useMemo(() => incident.frames.slice(0, index + 1), [incident, index]);
  const latest = frames[frames.length - 1] ?? null;

  const flagged = index >= incident.flagAtSecond;
  const decided = index >= incident.operatorDecision.decidedAtSecond;

  return (
    <div className="flex h-screen min-w-[1280px] flex-col bg-background">
      <TopBar status="live" met={latest?.met ?? null} anomalyCount={1} criticalCount={1} />

      <div className="flex items-center gap-2 border-b border-primary/40 bg-primary/10 px-4 py-1.5">
        <History className="size-3.5 text-primary" />
        <span className="text-[0.75rem] text-primary">
          Replaying archived incident {incident.id} — {incident.name}
        </span>
        <span className="num ml-auto text-[0.7rem] text-primary/80">
          {new Date(incident.startedAt).toISOString().replace("T", " ").slice(0, 19)}Z
        </span>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-[22rem_minmax(0,1fr)_24rem] gap-2 p-2">
        <TelemetryPanel frames={frames} status="live" />
        <AttitudeViewer latest={latest} status="live" />

        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto scroll-thin pr-0.5">
          <section
            className={cn(
              "panel transition-opacity duration-200",
              flagged ? "opacity-100" : "opacity-40",
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
                  <p className="mt-1 text-[0.82rem] leading-snug font-medium">{incident.event.title}</p>
                  <p className="label-tech mt-1">{incident.event.detector}</p>
                </div>
                <DiagnosisCard diagnosis={incident.event.diagnosis} />
              </>
            ) : (
              <p className="px-3 py-4 text-center text-[0.75rem] text-muted-foreground">
                Nominal — anomaly fires at T+{incident.flagAtSecond}s
              </p>
            )}
          </section>

          <section className={cn("panel transition-opacity duration-200", decided ? "opacity-100" : "opacity-40")}>
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
                <p className="num text-[0.8rem] text-foreground">{incident.operatorDecision.action}</p>
                <p className="text-[0.78rem] leading-snug text-muted-foreground">
                  {incident.operatorDecision.outcome}
                </p>
              </div>
            ) : (
              <p className="px-3 py-4 text-center text-[0.75rem] text-muted-foreground">
                Awaiting operator authorization in replay
              </p>
            )}
          </section>
        </div>
      </main>

      <div className="px-2 pb-2">
        <ReplayTimeline incident={incident} index={index} onIndexChange={setIndex} />
      </div>
    </div>
  );
}
