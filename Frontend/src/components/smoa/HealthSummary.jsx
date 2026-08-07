import { useMemo } from "react";

export default function HealthSummary({ latest, history = [], status }) {
  // 1. Calculate health score derived from anomalyScore
  const healthScore = useMemo(() => {
    if (status === "disconnected") return 0;
    const score = latest?.anomalyScore ?? 0.05; // default nominal is 0.05
    return Math.max(0, Math.min(100, Math.round(100 * (1 - score))));
  }, [latest, status]);

  // 2. Evaluate subsystem statuses
  const subsystems = useMemo(() => {
    if (!latest) return { power: true, thermal: true, adcs: true, comms: true };
    return {
      power: latest.power.busVoltage >= 26.0 && latest.power.stateOfCharge >= 25,
      thermal: latest.thermal.batteryTemp < 32 && latest.thermal.payloadTemp < 45,
      adcs: latest.adcs.bodyRate < 1.2,
      comms: latest.comms.packetLoss < 15,
    };
  }, [latest]);

  const nominalCount = useMemo(() => {
    return Object.values(subsystems).filter(Boolean).length;
  }, [subsystems]);

  // 3. Extract the last 20 frames for the sparkline trend
  const sparklinePoints = useMemo(() => {
    const frames = history.slice(-20);
    if (frames.length === 0) {
      return Array(20).fill(95); // default flat line
    }
    return frames.map((f) => {
      const score = f.anomalyScore ?? 0.05;
      return Math.max(0, Math.min(100, Math.round(100 * (1 - score))));
    });
  }, [history]);

  // 4. Generate SVG path for the sparkline
  const sparklinePath = useMemo(() => {
    const w = 60;
    const h = 18;
    const len = sparklinePoints.length;
    if (len === 0) return "";
    const dx = len > 1 ? w / (len - 1) : 0;
    
    return sparklinePoints
      .map((val, i) => {
        const x = i * dx;
        const y = h - (val / 100) * (h - 4) - 2; // leave 2px padding
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [sparklinePoints]);

  // 5. Select color and alarm summary text
  const healthColorClass =
    healthScore >= 75
      ? "text-nominal"
      : healthScore >= 45
        ? "text-warning"
        : "text-critical";

  const alarmStatus = useMemo(() => {
    if (status === "disconnected") {
      return {
        text: "CRITICAL: TELEMETRY DISCONNECTED",
        cls: "text-critical border-critical/30 bg-critical/10 animate-pulse",
      };
    }
    if (latest && latest.anomalyScore !== undefined) {
      if (latest.anomalyScore > 0.6) {
        return {
          text: `CRITICAL ALARM: BUS VOLTAGE DROOP DETECTED (${(latest.anomalyScore * 100).toFixed(0)}%)`,
          cls: "text-critical border-critical/30 bg-critical/10 animate-pulse",
        };
      }
      if (latest.anomalyScore > 0.3) {
        return {
          text: `WARNING: TRANSIENT VARIATION DETECTED (${(latest.anomalyScore * 100).toFixed(0)}%)`,
          cls: "text-warning border-warning/30 bg-warning/5",
        };
      }
    }
    return {
      text: "SYSTEMS NOMINAL — ALL PAYLOADS LOCKED",
      cls: "text-nominal border-nominal/20 bg-nominal/5",
    };
  }, [latest, status]);

  return (
    <div className="bg-[#040810] px-3 py-2.5 border-t border-border/20 text-foreground select-none">
      <div className="flex items-center gap-3">
        {/* Large Health Score */}
        <div className="flex flex-col leading-none">
          <span className="font-mono text-[0.52rem] text-muted-foreground uppercase tracking-wider">Health</span>
          <span className={`num text-xl font-bold ${healthColorClass}`}>
            {healthScore}
            <span className="text-[0.62rem] text-muted-foreground font-normal ml-0.5">%</span>
          </span>
        </div>

        {/* Sparkline trend */}
        <div className="flex items-center gap-1.5 ml-1">
          <svg className="w-[60px] h-[18px]" viewBox="0 0 60 18">
            <path
              d={sparklinePath}
              fill="none"
              stroke={healthScore >= 75 ? "#57c67a" : healthScore >= 45 ? "#f0a83b" : "#ef5350"}
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* Dynamic Chips Column */}
        <div className="ml-auto flex flex-col gap-1 items-end">
          <div className="flex gap-1.5">
            {/* Subsystems chip */}
            <span className="rounded-xs border border-border/40 bg-surface px-1 py-0.5 font-mono text-[0.58rem] font-bold text-muted-foreground uppercase whitespace-nowrap">
              {nominalCount}/4 NOMINAL
            </span>

            {/* Sunlit/Eclipse chip */}
            {latest?.eclipse ? (
              <span className="rounded-xs border border-warning/30 bg-warning/15 px-1 py-0.5 font-mono text-[0.58rem] font-bold text-warning uppercase whitespace-nowrap">
                ECLIPSE
              </span>
            ) : (
              <span className="rounded-xs border border-[#4fd8c8]/30 bg-[#4fd8c8]/10 px-1 py-0.5 font-mono text-[0.58rem] font-bold text-[#4fd8c8] uppercase whitespace-nowrap">
                SUNLIT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alarm summary banner */}
      <div className={`mt-2 rounded-xs border px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-[0.02em] text-center truncate ${alarmStatus.cls}`}>
        {alarmStatus.text}
      </div>
    </div>
  );
}
