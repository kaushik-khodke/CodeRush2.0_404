import StatusBadge from './StatusBadge.jsx';
import './AgentRoster.css';

const statusMeta = {
  active: { label: 'ACTIVE' },
  standby: { label: 'STANDBY' },
  watching: { label: 'GATING' }
};

export default function AgentRoster({ agents, selectedAgentId, onSelect }) {
  return (
    <aside className="roster">
      <div className="roster__heading">Control Room</div>
      <div className="roster__list">
        {agents.map((agent) => {
          const meta = statusMeta[agent.status];
          const isSelected = agent.id === selectedAgentId;
          return (
            <button
              key={agent.id}
              className={`roster__card${isSelected ? ' roster__card--selected' : ''}`}
              onClick={() => onSelect(agent.id)}
            >
              <div className="roster__card-top">
                <span className="roster__name">{agent.name}</span>
                <StatusBadge status={agent.status} label={meta.label} hasDot={true} />
              </div>
              <div className="roster__role">{agent.role}</div>
              <div className="roster__confidence-track">
                <div
                  className="roster__confidence-fill"
                  style={{ width: `${agent.confidence * 100}%` }}
                />
              </div>
              <div className="roster__last-action">{agent.lastAction}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
