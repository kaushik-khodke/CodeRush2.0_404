import './AnomalyPanel.css';

export default function AnomalyPanel({ anomaly }) {
  return (
    <section className="anomaly">
      <div className="anomaly__header">
        <div>
          <div className="anomaly__id">
            {anomaly.id} <span className="anomaly__severity">{anomaly.severity}</span>
          </div>
          <h2 className="anomaly__title">{anomaly.title}</h2>
        </div>
        <div className="anomaly__meta">
          <div>Detected by {anomaly.detectedBy}</div>
          <div>{anomaly.detectedAt}</div>
        </div>
      </div>

      <div className="anomaly__subheading">Root cause reasoning</div>
      <div className="anomaly__hypotheses">
        {anomaly.rootCauseHypotheses.map((h, i) => (
          <div className="hypothesis" key={h.cause}>
            <div className="hypothesis__top">
              <span className="hypothesis__rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="hypothesis__cause">{h.cause}</span>
              <span className="hypothesis__prob">{Math.round(h.probability * 100)}%</span>
            </div>
            <div className="hypothesis__bar-track">
              <div
                className="hypothesis__bar-fill"
                style={{ width: `${h.probability * 100}%` }}
              />
            </div>
            <ul className="hypothesis__evidence">
              {h.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
