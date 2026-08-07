import { useMemo } from "react";
import { getPositionAtTime } from "@/lib/orbit";
import { elevationAngle, azimuthAngle, bearingBetween } from "@/lib/groundContact";
import { groundStations } from "@/data/groundStations";

export default function CoverageRadar({ latest }) {
  const met = latest?.met ?? 128400;

  // Center of our sky-plot in the SVG viewBox
  const CX = 150;
  const CY = 65;
  const R = 50; // Radius of outer horizon circle (0 degrees elevation)

  // 1. Svalbard reference station (center)
  const sgs = groundStations[0];
  const mcmurdo = groundStations[1];
  const canberra = groundStations[2];

  // 2. Compute dynamic satellite position in ECI
  const satPos = useMemo(() => {
    return getPositionAtTime(met);
  }, [met]);

  // 3. Compute active elevation and azimuth from SGS
  const el = useMemo(() => {
    return elevationAngle(satPos, sgs, met);
  }, [satPos, sgs, met]);

  const az = useMemo(() => {
    return azimuthAngle(satPos, sgs, met);
  }, [satPos, sgs, met]);

  // 4. Compute satellite position on radar screen
  const isAos = el > 0;
  const radarRadius = useMemo(() => {
    // R corresponds to 0 deg elevation, 0 corresponds to 90 deg elevation
    const clampedEl = Math.max(0, Math.min(90, el));
    return R * (1 - clampedEl / 90);
  }, [el, R]);

  const satCoordinates = useMemo(() => {
    // Offset angle by -90 deg (North is up)
    const angleRad = ((az - 90) * Math.PI) / 180;
    const r = isAos ? radarRadius : R + 2; // put slightly outside if LOS
    return {
      x: CX + r * Math.cos(angleRad),
      y: CY + r * Math.sin(angleRad),
    };
  }, [az, isAos, radarRadius, CX, CY, R]);

  // 5. Compute bearing directions of other ground stations relative to Svalbard
  const mcmurdoBearing = useMemo(() => {
    return bearingBetween(sgs.lat, sgs.lon, mcmurdo.lat, mcmurdo.lon);
  }, [sgs, mcmurdo]);

  const canberraBearing = useMemo(() => {
    return bearingBetween(sgs.lat, sgs.lon, canberra.lat, canberra.lon);
  }, [sgs, canberra]);

  const mcmurdoPos = useMemo(() => {
    const angleRad = ((mcmurdoBearing - 90) * Math.PI) / 180;
    return {
      x: CX + R * Math.cos(angleRad),
      y: CY + R * Math.sin(angleRad),
    };
  }, [mcmurdoBearing, CX, CY, R]);

  const canberraPos = useMemo(() => {
    const angleRad = ((canberraBearing - 90) * Math.PI) / 180;
    return {
      x: CX + R * Math.cos(angleRad),
      y: CY + R * Math.sin(angleRad),
    };
  }, [canberraBearing, CX, CY, R]);

  return (
    <div className="flex flex-col bg-[#050b18] px-3 py-2 border-t border-border/20 text-foreground select-none h-[130px] justify-center">
      <div className="flex justify-between items-center mb-1">
        <span className="font-tech text-[0.62rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          RADAR COVERAGE SKY-PLOT
        </span>
        <span className="font-tech text-[0.62rem] font-bold text-[#f0a83b] uppercase">
          SGS REF
        </span>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <svg viewBox="0 0 300 110" className="w-full h-full">
          <defs>
            {/* Soft glow filter for active satellite */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Radar background grid */}
          <circle cx={CX} cy={CY} r={R} fill="#081026" stroke="#1f6f78" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
          <circle cx={CX} cy={CY} r={R * (2/3)} stroke="#1f6f78" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
          <circle cx={CX} cy={CY} r={R * (1/3)} stroke="#1f6f78" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.45" />

          {/* Concentric Elevation Labels */}
          <text x={CX + 2} y={CY - R * (2/3) + 3} className="font-mono text-[5px] fill-muted-foreground/60">60°</text>
          <text x={CX + 2} y={CY - R * (1/3) + 3} className="font-mono text-[5px] fill-muted-foreground/60">30°</text>

          {/* Crosshairs */}
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#1f6f78" strokeWidth="0.5" opacity="0.3" />
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="#1f6f78" strokeWidth="0.5" opacity="0.3" />

          {/* Compass headings */}
          <text x={CX} y={CY - R - 2} textAnchor="middle" className="font-mono text-[6px] fill-muted-foreground font-bold">N</text>
          <text x={CX + R + 4} y={CY + 2} textAnchor="middle" className="font-mono text-[6px] fill-muted-foreground font-bold">E</text>
          <text x={CX} y={CY + R + 6} textAnchor="middle" className="font-mono text-[6px] fill-muted-foreground font-bold">S</text>
          <text x={CX - R - 4} y={CY + 2} textAnchor="middle" className="font-mono text-[6px] fill-muted-foreground font-bold">W</text>

          {/* Ground Station Markers on the periphery */}
          {/* McMurdo */}
          <circle cx={mcmurdoPos.x} cy={mcmurdoPos.y} r="1.8" fill="#5c6f84" opacity="0.85" />
          <text x={mcmurdoPos.x > CX ? mcmurdoPos.x + 3 : mcmurdoPos.x - 3} y={mcmurdoPos.y + 1.5} textAnchor={mcmurdoPos.x > CX ? "start" : "end"} className="font-mono text-[5px] fill-muted-foreground/80">MCM</text>

          {/* Canberra */}
          <circle cx={canberraPos.x} cy={canberraPos.y} r="1.8" fill="#5c6f84" opacity="0.85" />
          <text x={canberraPos.x > CX ? canberraPos.x + 3 : canberraPos.x - 3} y={canberraPos.y + 1.5} textAnchor={canberraPos.x > CX ? "start" : "end"} className="font-mono text-[5px] fill-muted-foreground/80">CAN</text>

          {/* Reference Ground Station SGS at the center */}
          <polygon points={`${CX},${CY - 3.2} ${CX + 2.8},${CY + 2} ${CX - 2.8},${CY + 2}`} fill="#f0a83b" />

          {/* Satellite Trajectory Indicator */}
          {isAos ? (
            <g>
              <circle cx={satCoordinates.x} cy={satCoordinates.y} r="3.2" fill="#4fd8c8" filter="url(#glow-cyan)" />
              <circle cx={satCoordinates.x} cy={satCoordinates.y} r="1.2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              {/* LOS: Red, blinking border/dot */}
              <circle cx={satCoordinates.x} cy={satCoordinates.y} r="2.8" fill="#ef5350" filter="url(#glow-green)" opacity="0.6" />
              <line x1={satCoordinates.x - 2} y1={satCoordinates.y - 2} x2={satCoordinates.x + 2} y2={satCoordinates.y + 2} stroke="#ffffff" strokeWidth="0.5" />
              <line x1={satCoordinates.x + 2} y1={satCoordinates.y - 2} x2={satCoordinates.x - 2} y2={satCoordinates.y + 2} stroke="#ffffff" strokeWidth="0.5" />
            </g>
          )}

          {/* Telemetry info layout */}
          <g transform="translate(15, 15)" className="font-mono text-[6px]">
            <text x="0" y="10" className="fill-muted-foreground uppercase">El: <tspan className={isAos ? "fill-[#4fd8c8] font-bold" : "fill-[#ef5350] font-bold"}>{el.toFixed(1)}°</tspan></text>
            <text x="0" y="20" className="fill-muted-foreground uppercase">Az: <tspan className="fill-foreground font-bold">{az.toFixed(0)}°</tspan></text>
            <text x="0" y="30" className="fill-muted-foreground uppercase">State: <tspan className={isAos ? "fill-nominal font-bold" : "fill-critical font-bold"}>{isAos ? "AOS (LINK)" : "LOS (SHADOW)"}</tspan></text>
          </g>

          <g transform="translate(225, 15)" className="font-mono text-[6px]">
            <text x="0" y="10" className="fill-muted-foreground uppercase">Range:</text>
            <text x="0" y="20" className="fill-foreground font-bold">{(isAos ? (830 + Math.random() * 5) : 1950).toFixed(0)} km</text>
            <text x="0" y="30" className="fill-muted-foreground uppercase">Pass: <tspan className="fill-[#f0a83b] font-bold">ACTV</tspan></text>
          </g>
        </svg>
      </div>
    </div>
  );
}
