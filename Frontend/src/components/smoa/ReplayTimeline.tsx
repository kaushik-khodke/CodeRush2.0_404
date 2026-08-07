import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { formatMet } from "@/lib/smoa/api";
import type { ReplayIncident } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 2, 4, 8];

export function ReplayTimeline({
  incident,
  index,
  onIndexChange,
}: {
  incident: ReplayIncident;
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const idxRef = useRef(index);
  idxRef.current = index;

  const total = incident.frames.length;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = idxRef.current + 1;
      if (next >= total) {
        setPlaying(false);
        return;
      }
      onIndexChange(next);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, total, onIndexChange]);

  const markers = useMemo(
    () => [
      { at: incident.flagAtSecond, label: "Anomaly flagged", tone: "bg-warning" },
      { at: incident.operatorDecision.decidedAtSecond, label: "Operator decision", tone: "bg-primary" },
    ],
    [incident],
  );

  const frame = incident.frames[Math.min(index, total - 1)]!;

  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Replay Timeline</h3>
        <span className="num text-[0.7rem] text-muted-foreground">
          T+{String(index).padStart(3, "0")} s / {total} s · MET {formatMet(frame.met)}
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="relative">
          <div className="h-1.5 w-full rounded-full bg-background">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${(index / (total - 1)) * 100}%` }}
              transition={{ duration: 0.15, ease: "linear" }}
            />
          </div>
          {markers.map((m) => (
            <div
              key={m.label}
              title={m.label}
              className={cn("absolute -top-1 h-3.5 w-0.5", m.tone)}
              style={{ left: `${(m.at / (total - 1)) * 100}%` }}
            />
          ))}
          <input
            type="range"
            min={0}
            max={total - 1}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              onIndexChange(Number(e.target.value));
            }}
            aria-label="Scrub incident timeline"
            className="absolute inset-x-0 -top-2 h-6 w-full cursor-pointer appearance-none bg-transparent accent-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-primary/70 px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-primary uppercase transition-colors duration-150 hover:bg-primary/12"
          >
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              onIndexChange(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
          >
            <RotateCcw className="size-3" /> Reset
          </button>

          <div className="ml-auto flex items-center gap-1">
            <span className="label-tech mr-1">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "num rounded-sm border px-2 py-1 text-[0.68rem] transition-colors duration-150",
                  s === speed
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
