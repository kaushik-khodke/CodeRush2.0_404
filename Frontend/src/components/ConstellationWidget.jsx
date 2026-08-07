import Scene from "./twin3d/Scene";
import CoverageRadar from "./twin3d/CoverageRadar";
import HealthSummary from "./smoa/HealthSummary";

export function ConstellationWidget({ latest, history = [], status }) {
  return (
    <div className="panel flex flex-col overflow-hidden w-full shrink-0 bg-black border border-border rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* 3D Earth-orbit visualization */}
      <div className="relative">
        <Scene latest={latest} status={status} />
      </div>

      {/* 2D Coverage skyplot / Radar */}
      <CoverageRadar latest={latest} />

      {/* Health summary status */}
      <HealthSummary latest={latest} history={history} status={status} />
    </div>
  );
}

export default ConstellationWidget;
