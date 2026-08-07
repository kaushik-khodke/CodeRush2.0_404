import { useEffect } from 'react';
import './ToastContainer.css';

export default function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-dismiss after 5s

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const severityColor = {
    NOMINAL: 'var(--accent-green)',
    CAUTION: 'var(--accent-amber)',
    CRITICAL: 'var(--accent-red)',
    INFO: 'var(--accent-violet)'
  };

  return (
    <div
      className="toast-card"
      style={{
        borderLeftColor: severityColor[toast.severity] || 'var(--line-bright)'
      }}
    >
      <div className="toast-card__header">
        <span className="toast-card__title" style={{ color: severityColor[toast.severity] }}>
          {toast.title}
        </span>
        <button className="toast-card__close-btn" onClick={() => onClose(toast.id)}>
          &times;
        </button>
      </div>
      <div className="toast-card__body">{toast.message}</div>
      <div className="toast-card__meta">{toast.timestamp}</div>
    </div>
  );
}
