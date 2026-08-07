import './AgentRoster.css';

const statusMeta = {
  active: { label: 'ACTIVE', color: 'var(--accent-cyan)' },
  standby: { label: 'STANDBY', color: 'var(--text-tertiary)' },
  watching: { label: 'GATING', color: 'var(--accent-amber)' }
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
                <span className="roster__status" style={{ color: meta.color }}>
                  <span className="roster__status-dot" style={{ background: meta.color }} />
                  {meta.label}
                </span>
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
