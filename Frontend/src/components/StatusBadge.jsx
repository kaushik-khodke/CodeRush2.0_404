import './StatusBadge.css';

export default function StatusBadge({ status, label, hasDot = false }) {
  const normStatus = (status || '').toUpperCase();
  const displayLabel = label || normStatus;

  const statusClassMap = {
    NOMINAL: 'nominal',
    CAUTION: 'caution',
    CRITICAL: 'critical',
    ACTIVE: 'active',
    STANDBY: 'standby',
    WATCHING: 'gating', // "watching" maps to gating
    GATING: 'gating',
  };

  const cleanClass = statusClassMap[normStatus] || 'standby';

  return (
    <span className={`status-badge status-badge--${cleanClass}`}>
      {hasDot && <span className={`status-badge__dot status-badge__dot--${cleanClass}`} />}
      {displayLabel}
    </span>
  );
}
