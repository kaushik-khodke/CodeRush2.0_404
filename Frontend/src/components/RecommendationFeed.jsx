import { useState } from 'react';
import './RecommendationFeed.css';

const riskColor = {
  LOW: 'var(--accent-green)',
  MEDIUM: 'var(--accent-amber)',
  HIGH: 'var(--accent-red)'
};

export default function RecommendationFeed({ recommendations, decisions, onDecide, onHover }) {
  const [confirmingAction, setConfirmingAction] = useState(null); // { id, type: 'approved' | 'rejected' }
  const [operatorNote, setOperatorNote] = useState('');

  const triggerConfirm = (id, type) => {
    setConfirmingAction({ id, type });
    setOperatorNote('');
  };

  const submitDecision = (id) => {
    if (!confirmingAction) return;
    onDecide(id, confirmingAction.type, operatorNote.trim());
    setConfirmingAction(null);
  };

  return (
    <section className="recs">
      <div className="panel-heading">
        <span>Recommendations</span>
        <span className="panel-heading__meta">human approval required</span>
      </div>

      <div className="recs__list">
        {recommendations.map((rec) => {
          const decision = decisions[rec.id];
          const blocked = rec.status === 'not_recommended';
          const isConfirmingThis = confirmingAction?.id === rec.id;

          return (
            <div
              className={`rec-card${blocked ? ' rec-card--blocked' : ''}`}
              key={rec.id}
              onMouseEnter={() => onHover && onHover(rec.id)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <div className="rec-card__top">
                <span className="rec-card__id">{rec.id}</span>
                <span className="rec-card__risk" style={{ color: riskColor[rec.riskScore] }}>
                  <span
                    className="rec-card__risk-dot"
                    style={{ background: riskColor[rec.riskScore] }}
                  />
                  {rec.riskScore} RISK
                </span>
              </div>

              <div className="rec-card__title">{rec.title}</div>

              <div className="rec-card__facts">
                <div>
                  <span className="rec-card__fact-label">Proposed by</span>
                  {rec.agent}
                </div>
                <div>
                  <span className="rec-card__fact-label">Confidence</span>
                  {Math.round(rec.confidence * 100)}%
                </div>
                <div>
                  <span className="rec-card__fact-label">Reversible</span>
                  {rec.reversible ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="rec-card__sim">
                <span className="rec-card__sim-label">
                  {rec.simulated ? 'Simulated outcome' : 'Not yet simulated'}
                </span>
                <p>{rec.simulationResult}</p>
                <p className="rec-card__objectives">{rec.preservesObjectives}</p>
              </div>

              {blocked ? (
                <div className="rec-card__blocked-note">
                  Warden gate: execution blocked pending lower-risk options
                </div>
              ) : decision ? (
                <div className={`rec-card__decision rec-card__decision--${decision.type}`}>
                  <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                    {decision.type === 'approved' ? 'Approved & Executing' : 'Rejected'} by operator
                  </div>
                  {decision.note && (
                    <div className="rec-card__decision-note">
                      &ldquo;{decision.note}&rdquo;
                    </div>
                  )}
                </div>
              ) : isConfirmingThis ? (
                <div className="rec-card__confirm-box">
                  <div className="rec-card__confirm-title">
                    Provide justification for {confirmingAction.type === 'approved' ? 'Approval' : 'Rejection'}:
                  </div>
                  <textarea
                    className="rec-card__note-input"
                    placeholder="Enter notes (optional)..."
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    rows={2}
                  />
                  <div className="rec-card__confirm-actions">
                    <button
                      className={`rec-btn ${
                        confirmingAction.type === 'approved' ? 'rec-btn--confirm-approve' : 'rec-btn--confirm-reject'
                      }`}
                      onClick={() => submitDecision(rec.id)}
                    >
                      Confirm {confirmingAction.type === 'approved' ? 'Approve' : 'Reject'}
                    </button>
                    <button
                      className="rec-btn rec-btn--cancel"
                      onClick={() => setConfirmingAction(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rec-card__actions">
                  <button
                    className="rec-btn rec-btn--approve"
                    onClick={() => triggerConfirm(rec.id, 'approved')}
                  >
                    Approve &amp; Execute
                  </button>
                  <button
                    className="rec-btn rec-btn--reject"
                    onClick={() => triggerConfirm(rec.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
