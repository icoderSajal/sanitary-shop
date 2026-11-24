import { Star, X } from 'lucide-react';

export function Stars({ value = 0, onChange, size = 16 }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? 'on' : ''} onClick={onChange ? () => onChange(n) : undefined} style={onChange ? { cursor: 'pointer' } : null} />
      ))}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')}>
        <div className="modal-h"><h3>{title}</h3><button className="icon" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (<label className="field"><span>{label}</span>{children}</label>);
export const Empty = ({ text }) => <div className="empty">{text}</div>;
export const StatusPill = ({ s }) => <span className={'pill ' + s}>{String(s).replace(/_/g, ' ')}</span>;
