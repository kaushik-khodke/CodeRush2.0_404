import './AuditLog.css';

export default function AuditLog({ entries }) {
  return (
    <footer className="audit">
      <span className="audit__label">Audit Trail</span>
      <div className="audit__track">
        {[...entries].reverse().map((e, i) => (
          <span className="audit__entry" key={i}>
            <span className="audit__t">{e.t}</span>
            <span className="audit__actor">{e.actor}</span>
            <span className="audit__event">
              {e.event}
              {e.note && (
                <span className="audit__note-text">
                  &ldquo;{e.note}&rdquo;
                </span>
              )}
            </span>
          </span>
        ))}
      </div>
    </footer>
  );
}
