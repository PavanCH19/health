import { bloodLabel } from '../lib/bloods';

export const BloodDrop = ({ group, size, tone = '' }) => (
  <span className={`drop ${size === 'sm' ? 'sm' : ''} ${tone}`} title={bloodLabel(group)}>
    <span>{bloodLabel(group)}</span>
  </span>
);

export const Tag = ({ tone = '', children }) => <span className={`tag ${tone}`}>{children}</span>;

export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;

export const Notice = ({ tone = '', children }) => <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : undefined}>{children}</div>;

export const Empty = ({ title, children, action }) => (
  <div className="empty">
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

export const Skeleton = ({ h = 64, count = 1 }) => (
  <>
    {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
  </>
);

export const PageHead = ({ title, children, action }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
    {action}
  </div>
);

export const Field = ({ label, hint, error, children, htmlFor }) => (
  <div className="field">
    {label && <label htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && !error && <span className="hint">{hint}</span>}
    {error && <span className="err" role="alert">{error}</span>}
  </div>
);

export const Toggle = ({ checked, onChange, label, disabled }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} disabled={disabled} />
    <i />
  </label>
);

export const CenteredSpinner = ({ label }) => (
  <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
    <div className="row"><Spinner /> <span>{label}</span></div>
  </div>
);
