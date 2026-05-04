// ──────────────────────────────────────────────────────────────
// Login + Magic Link — autenticación real contra el backend
// ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, prefillEmail }) {
  const [mode, setMode] = React.useState('password'); // 'password' | 'magic'
  const [email, setEmail] = React.useState(prefillEmail || '');
  const [password, setPassword] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [magicSent, setMagicSent] = React.useState(false);
  const [error, setError] = React.useState('');

  const doLogin = async () => {
    if (!email || !password) { setError('Ingrese correo y contraseña'); return; }
    setError(''); setLoading(true);
    try {
      const user = await api.login(email.trim(), password);
      onLogin(user);
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const doMagic = async () => {
    if (!email) { setError('Ingrese su correo'); return; }
    setError(''); setLoading(true);
    try {
      await api.requestMagicLink(email.trim());
      setMagicSent(true);
    } catch (e) {
      setError(e.message || 'Error al enviar el enlace');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') mode === 'password' ? doLogin() : doMagic(); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 24px 24px', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 360, margin: '0 auto', width: '100%' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--ink)', color: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          }}>CP</div>
          <div>
            <div className="display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Club Polideportivo</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Panel de acceso</div>
          </div>
        </div>

        <h1 className="display" style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {prefillEmail ? 'Ingresa tu contraseña.' : 'Buenas tardes.'}
        </h1>
        {prefillEmail ? (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', borderRadius: 10, marginBottom: 20,
            background: 'var(--present-soft)',
            border: '1px solid color-mix(in oklab, var(--present) 30%, transparent)',
          }}>
            <Icon.check size={15} style={{ color: 'var(--present)', marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontSize: 13, color: 'var(--present)', lineHeight: 1.45 }}>
              Enlace verificado. Tu correo ya está ingresado, solo falta la contraseña.
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.45 }}>
            Acceda con su correo institucional o solicite un enlace seguro de acceso rápido.
          </p>
        )}

        <div style={{ marginBottom: 18 }}>
          <Segmented
            value={mode}
            onChange={(v) => { setMode(v); setMagicSent(false); setError(''); }}
            options={[
              { value: 'password', label: 'Contraseña' },
              { value: 'magic', label: 'Enlace seguro' },
            ]}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
            background: 'var(--absent-soft)',
            border: '1px solid color-mix(in oklab, var(--absent) 30%, transparent)',
            fontSize: 13, color: 'var(--absent)', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {mode === 'password' && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Correo</div>
              <div style={{ position: 'relative' }}>
                <Icon.mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
                <input className="input" style={{ paddingLeft: 40 }}
                  type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
                  placeholder="correo@clubpoli.com" autoComplete="email"/>
              </div>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Contraseña</div>
              <div style={{ position: 'relative' }}>
                <Icon.lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
                <input className="input" style={{ paddingLeft: 40, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
                  placeholder="••••••••" autoComplete="current-password"/>
                <button onClick={() => setShowPass(!showPass)} aria-label="Mostrar contraseña"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 6 }}>
                  {showPass ? <Icon.eyeOff size={18}/> : <Icon.eye size={18}/>}
                </button>
              </div>
            </label>
            <Button onClick={doLogin} disabled={loading} style={{ marginTop: 10, width: '100%' }}>
              {loading ? 'Verificando…' : 'Ingresar'}
              {!loading && <Icon.arrowRight size={16}/>}
            </Button>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              Admin: admin@clubpoli.com · admin123<br/>
              Profesor: carlos.mendez@clubpoli.com · profesor123
            </div>
          </div>
        )}

        {mode === 'magic' && !magicSent && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Correo</div>
              <div style={{ position: 'relative' }}>
                <Icon.mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
                <input className="input" style={{ paddingLeft: 40 }}
                  type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey}
                  placeholder="correo@clubpoli.com"/>
              </div>
            </label>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: 12, borderRadius: 12,
              background: 'var(--accent-soft)',
              border: '1px solid color-mix(in oklab, var(--accent) 25%, transparent)',
            }}>
              <Icon.link size={16} style={{ color: 'var(--accent-ink)', marginTop: 2 }}/>
              <div style={{ fontSize: 12.5, color: 'var(--accent-ink)', lineHeight: 1.45 }}>
                Recibirá un enlace de un solo uso. Caduca en <b>15 minutos</b>.
                El enlace se imprime en la consola del servidor si no hay SMTP configurado.
              </div>
            </div>
            <Button onClick={doMagic} disabled={loading} style={{ marginTop: 4, width: '100%' }}>
              {loading ? 'Enviando…' : 'Enviarme el enlace'}
              {!loading && <Icon.link size={16}/>}
            </Button>
          </div>
        )}

        {mode === 'magic' && magicSent && (
          <div className="anim-fade card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 999,
              background: 'var(--present-soft)', color: 'var(--present)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Icon.check size={24}/>
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Enlace enviado</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 16, lineHeight: 1.45 }}>
              Revise la bandeja de <b>{email}</b> o copie el enlace desde la consola del servidor.
            </div>
            <button onClick={() => setMagicSent(false)} style={{
              background: 'transparent', border: '1px dashed var(--line-2)',
              padding: '10px 12px', borderRadius: 10, fontSize: 12, color: 'var(--ink-2)',
              cursor: 'pointer', width: '100%',
            }}>
              ← Volver
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
        v2.4.1 · SESIÓN CIFRADA
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
