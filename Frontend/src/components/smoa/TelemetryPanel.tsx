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
import { chartColors } from "@/lib/smoa/theme";
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
}

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  parsing: false,
  normalized: true,
  interaction: { mode: "index", intersect: false },
  elements: { point: { radius: 0 }, line: { borderWidth: 1.5, tension: 0.25 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: chartColors.charcoal,
      borderColor: "rgba(244,245,246,0.15)",
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
      grid: { color: chartColors.grid },
      border: { color: "rgba(244,245,246,0.15)" },
      ticks: {
        stepSize: 15,
        color: chartColors.axis,
        font: { family: "IBM Plex Mono, monospace", size: 9 },
        callback: (v) => `${v}s`,
      },
    },
  },
};

/** Each series gets its own (mostly hidden) axis so differing units stay legible. */
function axesFor(series: Series[]) {
  const scales: Record<string, unknown> = { ...(baseOptions.scales as object) };
  series.forEach((s, i) => {
    scales[`y${i}`] = {
      display: i === 0,
      position: "left",
      grid: { color: i === 0 ? chartColors.grid : "transparent", drawOnChartArea: i === 0 },
      border: { display: i === 0, color: "rgba(244,245,246,0.15)" },
      ticks: {
        maxTicksLimit: 5,
        color: chartColors.axis,
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
}: {
  title: string;
  series: Series[];
  frames: TelemetryFrame[];
  status: LinkStatus;
  badge?: string;
}) {
  // Rolling 60 s window, x-axis pinned to -60..0 so the trace slides instead of
  // rescaling (no jitter). Downsampled to <=120 points per series.
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
        backgroundColor: `${s.color}1f`,
        fill: false,
        spanGaps: true,
      })),
    };
  }, [window, series, last]);


  const loading = frames.length === 0;

  return (
    <section className="panel flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">{title}</h3>
          {badge && (
            <span className="rounded-sm border border-primary/50 bg-primary/10 px-1.5 py-px font-tech text-[0.6rem] font-semibold text-primary uppercase">
              {badge}
            </span>
          )}
        </div>
        <span className="label-tech">60 s · 1 Hz</span>
      </div>


      <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
        {series.map((s) => {
          const v = last ? s.read(last) : null;
          return (
            <div key={s.label} className="bg-surface px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="label-tech truncate">{s.label}</span>
              </div>
              <div className="num mt-1 text-[0.95rem] leading-none text-foreground">
                {v === null ? "––.–" : (s.fmt?.(v) ?? v.toFixed(2))}
                <span className="ml-1 text-[0.65rem] text-muted-foreground">{s.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative h-36 px-1.5 py-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="label-tech animate-pulse">Awaiting telemetry frames…</span>
          </div>
        ) : (
          <Line data={data as never} options={options} />
        )}
        {status === "disconnected" && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="font-tech text-[0.7rem] font-semibold tracking-[0.1em] text-critical uppercase">
              Feed stale — link lost
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function TelemetryPanel({ frames, status }: { frames: TelemetryFrame[]; status: LinkStatus }) {
  const power = useMemo<Series[]>(() => [
    { label: "Bus V", unit: "V", color: chartColors.teal, read: (f) => f.power.busVoltage },
    { label: "SoC", unit: "%", color: chartColors.green, read: (f) => f.power.stateOfCharge, fmt: (v) => v.toFixed(1) },
    { label: "Array", unit: "W", color: chartColors.amber, read: (f) => f.power.arrayPower, fmt: (v) => v.toFixed(0) },
  ], []);
  const thermal = useMemo<Series[]>(() => [
    { label: "Battery", unit: "°C", color: chartColors.amber, read: (f) => f.thermal.batteryTemp },
    { label: "Payload", unit: "°C", color: chartColors.tealLight, read: (f) => f.thermal.payloadTemp },
    { label: "Radiator", unit: "°C", color: chartColors.teal, read: (f) => f.thermal.radiatorTemp },
  ], []);
  const adcs = useMemo<Series[]>(() => [
    { label: "Roll", unit: "°", color: chartColors.teal, read: (f) => f.adcs.roll },
    { label: "Pitch", unit: "°", color: chartColors.tealLight, read: (f) => f.adcs.pitch },
    { label: "Body rate", unit: "°/s", color: chartColors.amber, read: (f) => f.adcs.bodyRate, fmt: (v) => v.toFixed(3) },
  ], []);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2 overflow-y-auto scroll-thin pr-0.5")}>
      <ChartCard title="Electrical Power" series={power} frames={frames} status={status} badge="ML Life Regressor" />
      <ChartCard title="Thermal Control" series={thermal} frames={frames} status={status} badge="ML Temp Regressor" />
      <ChartCard title="ADCS" series={adcs} frames={frames} status={status} />
    </div>
  );

}
