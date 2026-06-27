export function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', loading = false, ...props }) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input className={`field-input ${error ? 'field-input--error' : ''}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <select className={`field-input ${error ? 'field-input--error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  return (
    <div className={`alert alert--${type}`}>
      {children}
    </div>
  );
}

export function Badge({ enabled }) {
  return (
    <span className={`badge ${enabled ? 'badge--on' : 'badge--off'}`}>
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}

export function Spinner() {
  return <div className="page-spinner" />;
}
