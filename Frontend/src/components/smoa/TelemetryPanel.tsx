import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { WINDOW_SECONDS } from "@/lib/smoa/useTelemetry";
import type { LinkStatus, TelemetryFrame } from "@/lib/smoa/types";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Series {
  label: string;
  unit: string;
  color: string;
  read: (f: TelemetryFrame) => number;
  fmt?: (v: number) => string;
  min?: number;
  max?: number;
}

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  parsing: false,
  normalized: true,
  interaction: { mode: "index", intersect: false },
  elements: { point: { radius: 0 }, line: { borderWidth: 2, tension: 0.2 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      borderColor: "rgba(244,245,246,0.2)",
      borderWidth: 1,
      titleFont: { family: "IBM Plex Mono, monospace", size: 10 },
      bodyFont: { family: "IBM Plex Mono, monospace", size: 11 },
      padding: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
    },
  },
  scales: {
    x: {
      type: "linear",
      min: -WINDOW_SECONDS,
      max: 0,
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { color: "rgba(255,255,255,0.15)" },
      ticks: {
        stepSize: 15,
        color: "#94a3b8",
        font: { family: "IBM Plex Mono, monospace", size: 9 },
        callback: (v) => `${v}s`,
      },
    },
  },
};

function axesFor(series: Series[]) {
  const scales: Record<string, unknown> = { ...(baseOptions.scales as object) };
  series.forEach((s, i) => {
    scales[`y${i}`] = {
      display: i === 0,
      position: "left",
      min: s.min,
      max: s.max,
      grid: { color: i === 0 ? "rgba(255,255,255,0.06)" : "transparent", drawOnChartArea: i === 0 },
      border: { display: i === 0, color: "rgba(255,255,255,0.15)" },
      ticks: {
        maxTicksLimit: 5,
        color: "#94a3b8",
        font: { family: "IBM Plex Mono, monospace", size: 9 },
      },
    };
  });
  return { ...baseOptions, scales } as ChartOptions<"line">;
}

function ChartCard({
  title,
  series,
  frames,
  status,
  badge,
  isAnomaly,
}: {
  title: string;
  series: Series[];
  frames: TelemetryFrame[];
  status: LinkStatus;
  badge?: string;
  isAnomaly?: boolean;
}) {
  const window = useMemo(() => frames.slice(-WINDOW_SECONDS), [frames]);
  const last = window.length > 0 ? window[window.length - 1]! : null;
  const options = useMemo(() => axesFor(series), [series]);

  const data = useMemo(() => {
    const anchor = last?.met ?? 0;
    return {
      datasets: series.map((s, i) => ({
        label: s.label,
        yAxisID: `y${i}`,
        data: window.map((f) => ({ x: f.met - anchor, y: s.read(f) })),
        borderColor: s.color,
        backgroundColor: `${s.color}20`,
        fill: false,
        spanGaps: true,
      })),
    };
  }, [window, series, last]);

  const loading = frames.length === 0;

  return (
    <section className={cn(
      "panel flex flex-col transition-all duration-200",
      isAnomaly ? "border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-950/30" : ""
    )}>
      <div className="panel-header flex items-center justify-between border-b border-border/80 bg-surface/90 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", isAnomaly ? "bg-rose-500 animate-ping" : "bg-cyan-400")} />
          <h3 className={cn("font-tech text-xs font-bold tracking-[0.14em] uppercase", isAnomaly ? "text-rose-400" : "text-foreground")}>
            {title}
          </h3>
          {badge && (
            <span className="rounded-sm border border-cyan-500/40 bg-cyan-950/40 px-1.5 py-px font-tech text-[0.6rem] font-semibold text-cyan-300 uppercase">
              {badge}
            </span>
          )}
        </div>
        <span className="label-tech text-[0.65rem] text-muted-foreground">60 S · 1 HZ</span>
      </div>

      <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
        {series.map((s) => {
          const v = last ? s.read(last) : null;
          return (
            <div key={s.label} className="bg-surface px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="label-tech truncate text-[0.68rem] text-muted-foreground uppercase font-semibold">{s.label}</span>
              </div>
              <div className="num mt-1 text-[1.05rem] font-bold leading-none text-foreground">
                {v === null ? "––.–" : (s.fmt?.(v) ?? v.toFixed(2))}
                <span className="ml-1 text-[0.68rem] font-normal text-muted-foreground">{s.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative h-36 px-1.5 py-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="label-tech animate-pulse text-cyan-400">Awaiting telemetry frames…</span>
          </div>
        ) : (
          <Line data={data as never} options={options} />
        )}
        {status === "disconnected" && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="font-tech text-[0.72rem] font-bold tracking-[0.1em] text-rose-400 uppercase">
              Feed stale — link lost
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function TelemetryPanel({ frames, status }: { frames: TelemetryFrame[]; status: LinkStatus }) {
  const latest = frames.length > 0 ? frames[frames.length - 1] : null;
  const anomalyMode = latest?.anomalyMode || "nominal";

  const power = useMemo<Series[]>(() => [
    { label: "Bus V", unit: "V", color: "#38bdf8", read: (f) => f.power.busVoltage, min: 10, max: 40 },
    { label: "SoC", unit: "%", color: "#4ade80", read: (f) => f.power.stateOfCharge, fmt: (v) => v.toFixed(1), min: 0, max: 100 },
    { label: "Array", unit: "W", color: "#fbbf24", read: (f) => f.power.arrayPower, fmt: (v) => v.toFixed(0), min: 0, max: 500 },
  ], []);

  const thermal = useMemo<Series[]>(() => [
    { label: "Battery", unit: "°C", color: "#fbbf24", read: (f) => f.thermal.batteryTemp, min: 10, max: 90 },
    { label: "Payload", unit: "°C", color: "#38bdf8", read: (f) => f.thermal.payloadTemp, min: -20, max: 80 },
    { label: "Radiator", unit: "°C", color: "#ef4444", read: (f) => f.thermal.radiatorTemp, min: -50, max: 90 },
  ], []);

  const adcs = useMemo<Series[]>(() => [
    { label: "Roll", unit: "°", color: "#38bdf8", read: (f) => f.adcs.roll, min: -30, max: 30 },
    { label: "Pitch", unit: "°", color: "#818cf8", read: (f) => f.adcs.pitch, min: -30, max: 30 },
    { label: "Body rate", unit: "°/s", color: "#fbbf24", read: (f) => f.adcs.bodyRate, fmt: (v) => v.toFixed(3), min: 0, max: 3 },
  ], []);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2 overflow-y-auto scroll-thin pr-0.5")}>
      <ChartCard
        title="Electrical Power"
        series={power}
        frames={frames}
        status={status}
        badge="ML Life Regressor"
        isAnomaly={anomalyMode === "power_droop" || anomalyMode === "overfitting"}
      />
      <ChartCard
        title="Thermal Control"
        series={thermal}
        frames={frames}
        status={status}
        badge="ML Temp Regressor"
        isAnomaly={anomalyMode === "thermal_overheat" || anomalyMode === "overfitting"}
      />
      <ChartCard
        title="ADCS"
        series={adcs}
        frames={frames}
        status={status}
        isAnomaly={anomalyMode === "adcs_oscillation" || anomalyMode === "overfitting"}
      />
    </div>
  );
}
