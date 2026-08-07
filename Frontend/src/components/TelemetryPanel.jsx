import TelemetryChart from './TelemetryChart.jsx';
import './TelemetryPanel.css';

export default function TelemetryPanel({ channels }) {
  return (
    <section className="telemetry">
      <div className="panel-heading">
        <span>Live Telemetry</span>
        <span className="panel-heading__meta">{channels.length} channels &middot; 1Hz</span>
      </div>
      <div className="telemetry__grid">
        {channels.map((ch) => (
          <TelemetryChart
            key={ch.id}
            channelId={ch.id}
            label={ch.label}
            series={ch.series}
            current={ch.current}
            unit={ch.unit}
          />
        ))}
      </div>
    </section>
  );
}
