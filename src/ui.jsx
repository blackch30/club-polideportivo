// ──────────────────────────────────────────────────────────────
// Iconos SVG — stroke 1.75, currentColor
// ──────────────────────────────────────────────────────────────

function makeIcon(path, { size = 20, fill = false, stroke = 1.75 } = {}) {
  return (props) => {
    const s = props.size || size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
           stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
           aria-hidden="true" {...props}>
        {path}
      </svg>
    );
  };
}

const Icon = {
  chevronLeft: makeIcon(<path d="M15 6l-6 6 6 6"/>),
  chevronRight: makeIcon(<path d="M9 6l6 6-6 6"/>),
  chevronDown: makeIcon(<path d="M6 9l6 6 6-6"/>),
  check: makeIcon(<path d="M5 12l5 5L20 7"/>),
  x: makeIcon(<path d="M6 6l12 12M18 6L6 18"/>),
  plus: makeIcon(<path d="M12 5v14M5 12h14"/>),
  minus: makeIcon(<path d="M5 12h14"/>),
  search: makeIcon(<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>),
  clock: makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  calendar: makeIcon(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>),
  users: makeIcon(<><path d="M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 20v-2a4 4 0 00-3-3.87M16.5 3.13a4 4 0 010 7.75"/></>),
  user: makeIcon(<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0116 0v1"/></>),
  home: makeIcon(<path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-6h-8v6H5a2 2 0 01-2-2z"/>),
  settings: makeIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.54V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1.11-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.54-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.55-1.11 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.54V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.54 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.54 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.51 1z"/></>),
  bell: makeIcon(<><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></>),
  logout: makeIcon(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>),
  eye: makeIcon(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  eyeOff: makeIcon(<><path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.77 19.77 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.77 19.77 0 01-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12A3 3 0 119.88 9.88"/></>),
  link: makeIcon(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>),
  mail: makeIcon(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>),
  lock: makeIcon(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>),
  list: makeIcon(<><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/></>),
  grid: makeIcon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  cards: makeIcon(<><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/></>),
  filter: makeIcon(<path d="M3 5h18l-7 9v6l-4-2v-4z"/>),
  moreH: makeIcon(<><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>),
  arrowRight: makeIcon(<path d="M5 12h14M13 6l6 6-6 6"/>),
  arrowLeft: makeIcon(<path d="M19 12H5M11 6l-6 6 6 6"/>),
  sparkle: makeIcon(<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>),
  map: makeIcon(<><path d="M3 7v13l6-3 6 3 6-3V4l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></>),
  history: makeIcon(<><path d="M3 12a9 9 0 109-9 9.74 9.74 0 00-7 3L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/></>),
  trophy: makeIcon(<><path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4"/><path d="M6 5h12v5a6 6 0 01-12 0V5z"/><path d="M9 20h6M12 15v5"/></>),
  edit: makeIcon(<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>),
  dash: makeIcon(<path d="M5 12h14"/>),
  dotsV: makeIcon(<><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></>),
  creditCard: makeIcon(<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>),
};

// ── Avatar
function Avatar({ name, bg, size = 40, initials }) {
  const ini = initials || (name || '').split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div className="avatar" style={{
      width: size, height: size, background: bg || 'var(--surface-2)',
      color: 'oklch(22% 0.04 260)', fontSize: Math.round(size * 0.38),
    }}>{ini}</div>
  );
}

// ── Segmented
function Segmented({ options, value, onChange, size }) {
  return (
    <div className="segmented" style={size === 'lg' ? { padding: 4 } : {}}>
      {options.map(o => (
        <button key={o.value} aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          style={size === 'lg' ? { padding: '10px 18px', fontSize: 14 } : {}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Toast (controlled)
function Toast({ message, icon }) {
  if (!message) return null;
  return (
    <div className="toast">
      {icon || <Icon.check size={16} />}
      <span>{message}</span>
    </div>
  );
}

// ── Button
function Button({ variant = 'primary', size, onClick, children, style, ...rest }) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''}`;
  return <button className={cls.trim()} onClick={onClick} style={style} {...rest}>{children}</button>;
}

// ── IconButton (round, used in header)
function IconButton({ onClick, children, label }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

// ── Progress bar (cupos)
function CupoBar({ ocupados, total, tone = 'accent' }) {
  const pct = Math.min(100, (ocupados / total) * 100);
  const toneColor = tone === 'accent' ? 'var(--accent)' : 'var(--present)';
  return (
    <div style={{
      height: 6, borderRadius: 999, background: 'var(--surface-2)',
      overflow: 'hidden', border: '1px solid var(--line)',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: toneColor,
        borderRadius: 999,
        transition: 'width 0.4s ease',
      }}/>
    </div>
  );
}

// ── Sparkline (historial)
function Sparkline({ values, max }) {
  const m = max || Math.max(...values, 1);
  return (
    <div className="spark">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(4, (v / m) * 100)}%`, opacity: 0.3 + (v/m) * 0.7 }}/>
      ))}
    </div>
  );
}

Object.assign(window, { Icon, Avatar, Segmented, Toast, Button, IconButton, CupoBar, Sparkline });
