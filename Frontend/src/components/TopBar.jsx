import StatusBadge from './StatusBadge.jsx';
import './TopBar.css';

export default function TopBar({ spacecraft }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark">◎</span>
        <div>
          <div className="topbar__title">ORION AI</div>
          <div className="topbar__subtitle">Mission Operations Copilot</div>
        </div>
      </div>

      <div className="topbar__mission">
        <div className="topbar__mission-name">{spacecraft.name}</div>
        <div className="topbar__mission-meta">
          {spacecraft.mission} &middot; {spacecraft.orbit}
        </div>
      </div>

      <div className="topbar__stats">
        <div className="topbar__stat">
          <span className="topbar__stat-label">MET</span>
          <span className="topbar__stat-value">{spacecraft.missionElapsed}</span>
        </div>
        <div className="topbar__stat">
          <span className="topbar__stat-label">Vehicle Health</span>
          <span className="topbar__stat-value" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <StatusBadge status={spacecraft.overallHealth} hasDot={true} />
          </span>
        </div>
      </div>
    </header>
  );
}
