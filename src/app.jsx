// ──────────────────────────────────────────────────────────────
// App shell — navegación, frame mobile/desktop, Tweaks
// ──────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "lima",
  "density": "comfortable",
  "attendanceVariant": "checkbox",
  "dashboardLayout": "cards",
  "viewport": "mobile",
  "emptyDashboard": false,
  "mode": "admin"
}/*EDITMODE-END*/;

function useTweaks() {
  const [t, setT] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('profPanelTweaks') || 'null');
      return { ...TWEAK_DEFAULTS, ...(saved || {}) };
    } catch { return TWEAK_DEFAULTS; }
  });
  React.useEffect(() => {
    document.body.dataset.palette = t.palette;
    document.body.dataset.density = t.density;
    localStorage.setItem('profPanelTweaks', JSON.stringify(t));
    window.parent?.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*');
  }, [t]);
  return [t, setT];
}

function MobileFrame({ children, title }) {
  return (
    <div className="device-shell" style={{ width: 390, height: 780 }}>
      <div className="device-screen" style={{ width: '100%', height: '100%' }}>
        {/* Notch bar */}
        <div style={{
          height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--ink)',
          background: 'var(--bg)',
        }}>
          <span className="tnum">17:42</span>
          <div style={{ width: 90, height: 22, background: '#000', borderRadius: 999 }}/>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: 14, height: 9, borderRadius: 2, border: '1px solid var(--ink)', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 1, background: 'var(--ink)', borderRadius: 1, width: '70%' }}/>
            </span>
          </span>
        </div>
        <div className="app-phone" style={{ height: 'calc(100% - 28px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({ children }) {
  return (
    <div className="desktop-shell" style={{ height: 820 }}>
      <div className="desktop-toolbar">
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="tl-dot" style={{ background: '#FF5F57' }}/>
          <span className="tl-dot" style={{ background: '#FEBC2E' }}/>
          <span className="tl-dot" style={{ background: '#28C840' }}/>
        </div>
        <div style={{
          flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
        }}>
          clubpoli.com/profesor
        </div>
      </div>
      <div style={{ height: 'calc(100% - 40px)', display: 'flex', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  );
}

// ── Desktop Sidebar
function Sidebar({ route, setRoute, onLogout, onOpenWorkshop }) {
  const items = [
    { id: 'dashboard',      label: 'Inicio',    icon: <Icon.home size={18}/> },
    { id: 'agenda-prof',    label: 'Mi agenda', icon: <Icon.calendar size={18}/> },
    { id: 'history-global', label: 'Historial', icon: <Icon.history size={18}/> },
    { id: 'payments-prof',  label: 'Pagos',     icon: <Icon.creditCard size={18}/> },
    { id: 'profile',        label: 'Mi perfil', icon: <Icon.user size={18}/> },
  ];
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      borderRight: '1px solid var(--line)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 20px', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--ink)', color: 'var(--accent)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        }}>CP</div>
        <div>
          <div className="display" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>Club Poli.</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profesor</div>
        </div>
      </div>

      <div className="eyebrow" style={{ padding: '0 8px 8px' }}>Menú</div>
      {items.map(it => (
        <button key={it.id} onClick={() => setRoute({ name: it.id })} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10, border: 0,
          background: route.name === it.id ? 'var(--ink)' : 'transparent',
          color: route.name === it.id ? 'var(--bg)' : 'var(--ink-2)',
          fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', textAlign: 'left', marginBottom: 2,
        }}>
          {it.icon} {it.label}
        </button>
      ))}

      <div style={{ flex: 1 }}/>

      <div className="eyebrow" style={{ padding: '0 8px 8px' }}>Talleres</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflow: 'auto' }}>
        {WORKSHOPS.map(w => (
          <button key={w.id} onClick={() => onOpenWorkshop(w)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, border: 0,
            background: route.name === 'detail' && route.workshop?.id === w.id ? 'var(--surface-2)' : 'transparent',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: w.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{w.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.nombre}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }} className="tnum">{w.hora}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={PROFESSOR.nombre} bg={PROFESSOR.avatarBg} initials={PROFESSOR.iniciales} size={34}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{PROFESSOR.nombre}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Profesor</div>
        </div>
        <button onClick={onLogout} aria-label="Salir" style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 6 }}>
          <Icon.logout size={16}/>
        </button>
      </div>
    </aside>
  );
}

// ── Mobile TabBar
function TabBar({ route, setRoute, onOpenProfile }) {
  const current = route.name;
  return (
    <div className="tabbar">
      <button className="tab" aria-pressed={current === 'dashboard'} onClick={() => setRoute({ name: 'dashboard' })}>
        <Icon.home size={20}/>
        <span>Inicio</span>
      </button>
      <button className="tab" aria-pressed={current === 'agenda-prof'} onClick={() => setRoute({ name: 'agenda-prof' })}>
        <Icon.calendar size={20}/>
        <span>Agenda</span>
      </button>
      <button className="tab" aria-pressed={current === 'history-global'} onClick={() => setRoute({ name: 'history-global' })}>
        <Icon.history size={20}/>
        <span>Historial</span>
      </button>
      <button className="tab" aria-pressed={current === 'payments-prof'} onClick={() => setRoute({ name: 'payments-prof' })}>
        <Icon.creditCard size={20}/>
        <span>Pagos</span>
      </button>
      <button className="tab" aria-pressed={current === 'profile'} onClick={() => setRoute({ name: 'profile' })}>
        <Icon.user size={20}/>
        <span>Perfil</span>
      </button>
    </div>
  );
}

// ── Tweaks panel
function TweaksPanel({ tweaks, setTweaks, open, setOpen }) {
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 18, right: 18, zIndex: 1000,
        width: 44, height: 44, borderRadius: 999,
        background: 'var(--ink)', color: 'var(--bg)',
        border: 0, cursor: 'pointer',
        boxShadow: 'var(--shadow-lg)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }} aria-label="Abrir Tweaks">
        <Icon.settings size={20}/>
      </button>
    );
  }
  const set = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <span>Tweaks</span>
        <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 2 }}>
          <Icon.x size={16}/>
        </button>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Dispositivo</div>
        <div className="tweaks-row">
          <button className="tweaks-chip" aria-pressed={tweaks.viewport === 'mobile'} onClick={() => set('viewport', 'mobile')}>Mobile</button>
          <button className="tweaks-chip" aria-pressed={tweaks.viewport === 'desktop'} onClick={() => set('viewport', 'desktop')}>Desktop</button>
        </div>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Paleta</div>
        <div className="swatch-row">
          {[
            { id: 'lima', color: 'oklch(82% 0.19 125)' },
            { id: 'coral', color: 'oklch(72% 0.18 30)' },
            { id: 'azul', color: 'oklch(65% 0.18 245)' },
            { id: 'violeta', color: 'oklch(62% 0.20 300)' },
          ].map(s => (
            <button key={s.id} className="swatch" aria-pressed={tweaks.palette === s.id}
              style={{ background: s.color }} onClick={() => set('palette', s.id)} title={s.id}/>
          ))}
        </div>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Densidad</div>
        <div className="tweaks-row">
          <button className="tweaks-chip" aria-pressed={tweaks.density === 'compact'} onClick={() => set('density', 'compact')}>Compacta</button>
          <button className="tweaks-chip" aria-pressed={tweaks.density === 'comfortable'} onClick={() => set('density', 'comfortable')}>Cómoda</button>
        </div>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Toma de asistencia</div>
        <div className="tweaks-row">
          <button className="tweaks-chip" aria-pressed={tweaks.attendanceVariant === 'checkbox'} onClick={() => set('attendanceVariant', 'checkbox')}>Check</button>
          <button className="tweaks-chip" aria-pressed={tweaks.attendanceVariant === 'swipe'} onClick={() => set('attendanceVariant', 'swipe')}>2-botones</button>
          <button className="tweaks-chip" aria-pressed={tweaks.attendanceVariant === 'tri-state'} onClick={() => set('attendanceVariant', 'tri-state')}>Tri-estado</button>
        </div>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Layout dashboard</div>
        <div className="tweaks-row">
          <button className="tweaks-chip" aria-pressed={tweaks.dashboardLayout === 'cards'} onClick={() => set('dashboardLayout', 'cards')}>Cards</button>
          <button className="tweaks-chip" aria-pressed={tweaks.dashboardLayout === 'lista'} onClick={() => set('dashboardLayout', 'lista')}>Lista</button>
          <button className="tweaks-chip" aria-pressed={tweaks.dashboardLayout === 'grid'} onClick={() => set('dashboardLayout', 'grid')}>Grid</button>
        </div>
      </div>
      <div className="tweaks-section">
        <div className="tweaks-label">Estado</div>
        <div className="tweaks-row">
          <button className="tweaks-chip" aria-pressed={!tweaks.emptyDashboard} onClick={() => set('emptyDashboard', false)}>Con datos</button>
          <button className="tweaks-chip" aria-pressed={tweaks.emptyDashboard} onClick={() => set('emptyDashboard', true)}>Vacío</button>
        </div>
      </div>
    </div>
  );
}

// ── SetPasswordScreen
function SetPasswordScreen({ user, onLogin }) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      const res = await api.setPassword(password);
      onLogin(res.user);
    } catch (err) {
      setError(err.message || 'Error al guardar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div className="card" style={{ width: 380, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Primer acceso</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Bienvenido, {user.nombre}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            Para continuar, crea una contraseña para tu cuenta.
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Nueva contraseña</div>
            <input className="input" type="password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={e => setPassword(e.target.value)} autoFocus/>
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Confirmar contraseña</div>
            <input className="input" type="password" placeholder="Repite la contraseña"
              value={confirm} onChange={e => setConfirm(e.target.value)}/>
          </label>
          {error && (
            <div style={{ fontSize: 12.5, color: 'var(--absent)', background: 'var(--absent-soft, color-mix(in oklab, var(--absent) 12%, transparent))', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Guardando…' : 'Crear contraseña y acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Detecta si se está ejecutando en un dispositivo móvil real (no en el simulador de diseño)
const IS_REAL_MOBILE = window.innerWidth < 768;

// ── Main App
function App() {
  const [tweaks, setTweaks] = useTweaks();
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [needsPassword, setNeedsPassword] = React.useState(false);
  const [pendingUser, setPendingUser] = React.useState(null);
  const [magicEmail, setMagicEmail] = React.useState(null);
  const [loadingData, setLoadingData] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);
  const [route, setRoute] = React.useState({ name: 'dashboard' });
  const [toast, setToast] = React.useState('');
  const toastTimer = React.useRef(null);

  // Verificar sesión guardada al iniciar
  React.useEffect(() => {
    const token = api.getToken();
    if (token) {
      const fromMagic = !!api._fromMagicLink;
      api._fromMagicLink = false;
      setLoadingData(true);
      api.me().then(user => {
        return initAppData(user).then(() => {
          setUserRole(user.rol);
          if (user.rol === 'profesor' && user.estado === 'pendiente') {
            setPendingUser(user);
            setNeedsPassword(true);
            setAuthenticated(false);
          } else if (user.rol === 'profesor' && fromMagic) {
            // Magic link + contraseña ya configurada → mostrar login con email pre-relleno
            api.clearToken();
            setMagicEmail(user.email);
            setAuthenticated(false);
          } else {
            if (user.rol === 'admin') setTweaks(t => ({ ...t, mode: 'admin', viewport: 'desktop' }));
            else setTweaks(t => ({ ...t, mode: 'profesor', viewport: 'desktop' }));
            setAuthenticated(true);
          }
        });
      }).catch(() => {
        api.clearToken();
      }).finally(() => setLoadingData(false));
    }
  }, []);

  // Listen for edit mode from host
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  };

  const handleLogin = async (user) => {
    setLoadingData(true);
    try {
      setUserRole(user.rol);
      setMagicEmail(null);
      if (user.rol === 'admin') {
        await initAdminData();
        setTweaks(t => ({ ...t, mode: 'admin', viewport: 'desktop' }));
        setNeedsPassword(false);
        setAuthenticated(true);
      } else {
        await initAppData(user);
        setTweaks(t => ({ ...t, mode: 'profesor', viewport: 'desktop' }));
        if (user.rol === 'profesor' && user.estado === 'pendiente') {
          setPendingUser(user);
          setNeedsPassword(true);
          setAuthenticated(false);
        } else {
          setNeedsPassword(false);
          setAuthenticated(true);
        }
      }
    } catch (e) {
      showToast('Error cargando datos: ' + e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setAuthenticated(false);
    setRoute({ name: 'dashboard' });
  };

  const openWorkshop = (w) => setRoute({ name: 'detail', workshop: w });

  // ─── Cargando
  if (loadingData) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink-2)', fontSize: 14 }}>
        <span style={{ opacity: 0.5 }}>Cargando…</span>
      </div>
    );
  }

  // ─── Admin mode (independent shell)
  if (authenticated && tweaks.mode === 'admin') {
    return (
      <>
        <div className="viewport">
          <AdminShell
            onExitToProfesor={() => setTweaks(t => ({ ...t, mode: 'profesor' }))}
            onToast={showToast}
            onLogout={handleLogout}
            setTweaks={setTweaks}
          />
        </div>
        <Toast message={toast}/>
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} open={tweaksOpen} setOpen={setTweaksOpen}/>
      </>
    );
  }

  // ─── Set password (primer acceso profesor)
  if (needsPassword && pendingUser) {
    const inner = <SetPasswordScreen user={pendingUser} onLogin={handleLogin}/>;
    if (IS_REAL_MOBILE) {
      return (
        <div style={{ height: '100dvh', background: 'var(--bg)', overflow: 'auto' }}>
          {inner}
          <Toast message={toast}/>
        </div>
      );
    }
    return (
      <>
        <div className="viewport">
          {tweaks.viewport === 'mobile'
            ? <MobileFrame>{inner}</MobileFrame>
            : <DesktopFrame>
                <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>{inner}</div>
              </DesktopFrame>
          }
        </div>
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} open={tweaksOpen} setOpen={setTweaksOpen}/>
      </>
    );
  }

  // ─── Login view
  if (!authenticated) {
    const inner = <LoginScreen onLogin={handleLogin} prefillEmail={magicEmail}/>;
    if (IS_REAL_MOBILE) {
      return (
        <div style={{ height: '100dvh', background: 'var(--bg)', overflow: 'auto' }}>
          {inner}
          <Toast message={toast}/>
        </div>
      );
    }
    return (
      <>
        <div className="viewport">
          {tweaks.viewport === 'mobile'
            ? <MobileFrame>{inner}</MobileFrame>
            : <DesktopFrame>
                <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>{inner}</div>
              </DesktopFrame>
          }
        </div>
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} open={tweaksOpen} setOpen={setTweaksOpen}/>
      </>
    );
  }

  // ─── App content (same content, different chrome)
  const renderRoute = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard
          layout={tweaks.dashboardLayout}
          empty={tweaks.emptyDashboard}
          onOpenWorkshop={openWorkshop}
          onOpenProfile={() => setRoute({ name: 'profile' })}/>;
      case 'detail':
        return <WorkshopDetail
          workshop={route.workshop}
          variant={tweaks.attendanceVariant}
          onBack={() => setRoute({ name: 'dashboard' })}
          onShowHistory={() => setRoute({ name: 'history', workshop: route.workshop })}
          onShowAdd={() => setRoute({ name: 'add', workshop: route.workshop })}
          onToast={showToast}/>;
      case 'history':
        return <HistoryScreen
          workshop={route.workshop}
          onBack={() => setRoute({ name: 'detail', workshop: route.workshop })}/>;
      case 'history-global':
        return <GlobalHistoryScreen
          workshops={WORKSHOPS}
          onSelectWorkshop={(w) => setRoute({ name: 'history', workshop: w })}
          onBack={() => setRoute({ name: 'dashboard' })}/>;
      case 'agenda-prof':
        return <ProfesorAgendaScreen
          onBack={() => setRoute({ name: 'dashboard' })}/>;
      case 'payments-prof':
        return <ProfPaymentsScreen
          workshops={WORKSHOPS}
          onBack={() => setRoute({ name: 'dashboard' })}/>;
      case 'search-global':
        return <AddParticipantScreen
          workshop={WORKSHOPS[0]}
          onBack={() => setRoute({ name: 'dashboard' })}
          onToast={showToast}/>;
      case 'add':
        return <AddParticipantScreen
          workshop={route.workshop}
          onBack={() => setRoute({ name: 'detail', workshop: route.workshop })}
          onToast={showToast}/>;
      case 'profile':
        return <ProfileScreen
          onBack={() => setRoute({ name: 'dashboard' })}
          onLogout={handleLogout}/>;
      default:
        return null;
    }
  };

  const screenContent = renderRoute();
  const hideTabbarAlways = ['detail', 'add', 'history'].includes(route.name);
  const showTabbar = !hideTabbarAlways && !['history-global', 'search-global', 'profile', 'payments-prof'].includes(route.name);

  // ─── Dispositivo móvil real: sin frame simulador
  if (IS_REAL_MOBILE) {
    return (
      <>
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
          {!hideTabbarAlways && (
            <div className="appbar">
              <Avatar name={PROFESSOR.nombre} bg={PROFESSOR.avatarBg} initials={PROFESSOR.iniciales} size={36}/>
              <div style={{ flex: 1 }}/>
              <IconButton label="Notificaciones"><Icon.bell size={18}/></IconButton>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
            {screenContent}
          </div>
          {showTabbar && <TabBar route={route} setRoute={setRoute} onOpenProfile={() => setRoute({ name: 'profile' })}/>}
        </div>
        <Toast message={toast}/>
      </>
    );
  }

  // ─── Desktop / simulador
  const showSimTabbar = tweaks.viewport === 'mobile' && showTabbar;

  return (
    <>
      <div className="viewport">
        {tweaks.viewport === 'mobile' ? (
          <MobileFrame>
            {!hideTabbarAlways && (
              <div className="appbar" data-screen-label={`App / ${route.name}`}>
                <Avatar name={PROFESSOR.nombre} bg={PROFESSOR.avatarBg} initials={PROFESSOR.iniciales} size={36}/>
                <div style={{ flex: 1 }}/>
                <IconButton label="Notificaciones"><Icon.bell size={18}/></IconButton>
              </div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
              {screenContent}
            </div>
            {showSimTabbar && <TabBar route={route} setRoute={setRoute} onOpenProfile={() => setRoute({ name: 'profile' })}/>}
          </MobileFrame>
        ) : (
          <DesktopFrame>
            <Sidebar route={route} setRoute={setRoute}
              onLogout={handleLogout}
              onOpenWorkshop={openWorkshop}/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
              {screenContent}
            </div>
          </DesktopFrame>
        )}
      </div>
      <Toast message={toast}/>
      {userRole === 'admin' && <ModeSwitcher tweaks={tweaks} setTweaks={setTweaks}/>}
      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} open={tweaksOpen} setOpen={setTweaksOpen}/>
    </>
  );
}

function ModeSwitcher({ tweaks, setTweaks }) {
  return (
    <div className="metabar">
      <button aria-pressed={tweaks.mode === 'admin'} onClick={() => setTweaks(t => ({ ...t, mode: 'admin', viewport: 'desktop' }))}>
        Admin
      </button>
      <button aria-pressed={tweaks.mode === 'profesor'} onClick={() => setTweaks(t => ({ ...t, mode: 'profesor' }))}>
        Profesor
      </button>
    </div>
  );
}

Object.assign(window, { App, MobileFrame, DesktopFrame, ModeSwitcher });
