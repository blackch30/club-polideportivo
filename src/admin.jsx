// ──────────────────────────────────────────────────────────────
// Admin Panel — 5 módulos: Dashboard, Inscripción, Profesores, Reportes, Empresa
// ──────────────────────────────────────────────────────────────

// ── Helpers
function copyToClipboard(txt) {
  try { navigator.clipboard.writeText(txt); } catch {}
}
function buildMagicUrl(token) {
  return `https://clubpoli.com/profesor/acceso/${token}`;
}

// ── Bar chart simple (para reportes)
function BarChart({ values, labels, height = 120, accent }) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
        {values.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div style={{
                width: '100%', height: `${(v / max) * 100}%`,
                background: accent || 'var(--accent)',
                borderRadius: '6px 6px 2px 2px',
                transition: 'height 0.4s ease',
                minHeight: 4,
              }}/>
            </div>
          </div>
        ))}
      </div>
      {labels && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {labels.map((l, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KPI card
function Kpi({ label, value, delta, deltaPositive = true, sparkValues, unit }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
        <div className="display tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {unit === 'money' && <span style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>$ </span>}
          {value}
          {unit === 'pct' && <span style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>%</span>}
        </div>
        {sparkValues && <Sparkline values={sparkValues}/>}
      </div>
      {delta != null && (
        <div style={{ marginTop: 10, fontSize: 12, color: deltaPositive ? 'var(--present)' : 'var(--absent)', fontWeight: 600 }}>
          {deltaPositive ? '↑' : '↓'} {delta}% <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ReportePublicoModal({ onClose }) {
  const url = window.location.origin + '/reporte.html';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.link size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resumen público</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Compartir resumen del club</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            Comparte este enlace con apoderados y socios para que vean el resumen público del club (talleres, estadísticas, contacto). No requiere contraseña.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" readOnly value={url} style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)', background: 'var(--surface-2)' }} onClick={e => e.target.select()}/>
            <Button onClick={handleCopy} style={{ flexShrink: 0 }}>
              {copied ? <><Icon.check size={14}/> Copiado</> : <><Icon.link size={14}/> Copiar</>}
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm"><Icon.arrowRight size={13}/> Abrir en nueva pestaña</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onGoToProfesores, onNuevaInscripcion, onToast }) {
  const [dashStats, setDashStats] = React.useState(null);
  const totalAlumnos = dashStats?.alumnosActivos ?? (PARTICIPANTS_POOL.filter(p => p.estado === 'activo').length * 4);
  const totalTalleres = dashStats?.totalTalleres ?? WORKSHOPS.length;
  const linksActivos = dashStats?.linksActivos ?? Object.values(INITIAL_LINKS).filter(l => l.activo).length;
  const ingresosMes = dashStats != null
    ? (dashStats.ingresosMes / 1000).toFixed(1) + 'k'
    : REPORTES.ingresosMes.slice(-1)[0] + 'k';
  const asistenciaProm = dashStats?.asistenciaProm ?? 87;
  const [pendientes, setPendientes] = React.useState([]);
  const [reporteModal, setReporteModal] = React.useState(false);

  React.useEffect(() => {
    api.getDashboardReport().then(setDashStats).catch(() => {});
  }, []);

  React.useEffect(() => {
    api.getPendingInscriptions().then(data => setPendientes(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.approveInscription(id);
      setPendientes(prev => prev.filter(p => p.id !== id));
      onToast && onToast('Inscripción aprobada');
    } catch (e) { onToast && onToast('Error: ' + e.message); }
  };
  const handleReject = async (id) => {
    try {
      await api.rejectInscription(id);
      setPendientes(prev => prev.filter(p => p.id !== id));
      onToast && onToast('Inscripción rechazada');
    } catch (e) { onToast && onToast('Error: ' + e.message); }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Vista general</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            Buen día, Dirección.
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Icon.calendar size={14}/> Abril 2026</Button>
          <Button variant="secondary" size="sm" onClick={() => setReporteModal(true)}><Icon.link size={14}/> Compartir resumen</Button>
          <Button size="sm" onClick={onNuevaInscripcion}><Icon.plus size={14}/> Nueva inscripción</Button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Alumnos activos" value={totalAlumnos} delta={12} sparkValues={REPORTES.inscripcionesMes.slice(-8)}/>
        <Kpi label="Talleres en curso" value={totalTalleres} delta={0} deltaPositive={true}/>
        <Kpi label="Ingresos del mes" value={ingresosMes} unit="money" delta={8} sparkValues={REPORTES.ingresosMes.slice(-8)}/>
        <Kpi label="Asistencia prom." value={asistenciaProm} unit="pct" delta={3}/>
      </div>

      {/* Generador de link (destacado) */}
      <div className="card" style={{
        padding: 20, marginBottom: 18,
        background: 'linear-gradient(135deg, var(--ink) 0%, oklch(28% 0.03 260) 100%)',
        color: 'var(--bg)', border: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'var(--accent)', color: 'var(--accent-ink)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.link size={24}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'color-mix(in oklab, var(--bg) 60%, transparent)' }}>
              Acceso de profesores
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
              Generar enlace seguro de acceso al Panel de Profesor
            </div>
            <div style={{ fontSize: 13, color: 'color-mix(in oklab, var(--bg) 75%, transparent)', marginTop: 4, lineHeight: 1.4 }}>
              Hay <b className="tnum">{linksActivos}</b> enlaces activos · <b className="tnum">{totalTalleres}</b> talleres activos.
            </div>
          </div>
          <Button onClick={onGoToProfesores} style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
            Gestionar accesos <Icon.arrowRight size={16}/>
          </Button>
        </div>
      </div>

      {/* Inscripciones pendientes de aprobación */}
      {pendientes.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18, border: '2px solid color-mix(in oklab, var(--late) 40%, transparent)' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--late-soft)', borderBottom: '1px solid var(--line)' }}>
            <Icon.clock size={16} style={{ color: 'var(--late)' }}/>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--late)' }}>
              {pendientes.length} inscripci{pendientes.length === 1 ? 'ón' : 'ones'} pendiente{pendientes.length !== 1 ? 's' : ''} de aprobación
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Enviadas por profesores</div>
          </div>
          {pendientes.map((ins, i) => (
            <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < pendientes.length - 1 ? '1px solid var(--line)' : 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                {(ins.socio || '?').split(' ').map(s => s[0]).slice(0, 2).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{ins.socio}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{ins.taller} · {formatDateES(ins.fecha)}</div>
              </div>
              <Button size="sm" onClick={() => handleApprove(ins.id)}><Icon.check size={13}/> Aprobar</Button>
              <Button size="sm" variant="danger" onClick={() => handleReject(ins.id)}><Icon.x size={13}/> Rechazar</Button>
            </div>
          ))}
        </div>
      )}

      {/* Columna izquierda: inscripciones + actividad */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="eyebrow">Últimas inscripciones</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Actualizado hace 2 min</div>
            </div>
            <Button variant="ghost" size="sm">Ver todas <Icon.arrowRight size={12}/></Button>
          </div>
          {INSCRIPCIONES.slice(0, 6).map((ins, i, arr) => (
            <div key={ins.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--surface-2)', color: 'var(--ink-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              }}>{ins.socio.split(' ').map(s => s[0]).slice(0,2).join('')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{ins.socio}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{ins.taller}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>$ {ins.monto.toLocaleString('es-AR')}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{formatDateES(ins.fecha)}</div>
              </div>
              <span className={`pill pill-${ins.estado === 'confirmada' ? 'present' : ins.estado === 'cancelada' ? 'absent' : 'late'}`}>
                {ins.estado}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Inscripciones por mes</div>
            <BarChart values={REPORTES.inscripcionesMes} labels={['E','F','M','A','M','J','J','A','S','O','N','D']} height={100}/>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Profesores</div>
            {PROFESORES_ADMIN.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <Avatar name={p.nombre} bg={p.bg} initials={p.iniciales} size={28}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.talleres} taller(es)</div>
                </div>
                <span className={`pill pill-${p.estado === 'activo' ? 'present' : p.estado === 'pendiente' ? 'late' : 'muted'}`} style={{ fontSize: 10, padding: '2px 8px', height: 18 }}>
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {reporteModal && <ReportePublicoModal onClose={() => setReporteModal(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: SOCIOS (gestión de participantes/integrantes)
// ═══════════════════════════════════════════════════════════════
function AdminSocios({ onToast }) {
  const [socios, setSocios] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [modal, setModal] = React.useState(false);
  const [editando, setEditando] = React.useState(null);

  React.useEffect(() => {
    api.get('/participants').then(setSocios).catch(() => {});
  }, []);

  const filtered = socios.filter(s =>
    !q || s.nombre.toLowerCase().includes(q.toLowerCase()) || (s.contacto || '').includes(q)
  );

  const stats = {
    total: socios.length,
    activos: socios.filter(s => s.estado === 'activo').length,
    inactivos: socios.filter(s => s.estado !== 'activo').length,
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await api.deleteParticipant(id);
      setSocios(prev => prev.filter(s => s.id !== id));
      onToast('Socio eliminado');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Socios</h1>
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Icon.plus size={14}/> Nuevo socio
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Total socios"  value={stats.total}/>
        <Kpi label="Activos"       value={stats.activos}/>
        <Kpi label="Inactivos"     value={stats.inactivos}/>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Icon.search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
            <input className="input" placeholder="Buscar por nombre o contacto" style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
              value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }} className="tnum">{filtered.length} socios</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Socio', 'Edad', 'Contacto', 'Estado', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin socios registrados</td></tr>
            )}
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 0 }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.nombre} bg={s.avatar_bg} initials={s.iniciales} size={32}/>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.nombre}</div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-2)' }} className="tnum">{s.edad || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink-3)' }}>{s.contacto || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`pill pill-${s.estado === 'activo' ? 'present' : 'muted'}`}>
                    <span className="dot" style={{ background: 'currentColor' }}/>{s.estado}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <Button size="sm" variant="secondary" onClick={() => setEditando(s)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(s.id, s.nombre)}>
                      <Icon.x size={12}/>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <NuevoSocioModal
          onClose={() => setModal(false)}
          onSave={(socio) => { setSocios(prev => [socio, ...prev]); setModal(false); onToast('Socio registrado · ' + socio.nombre); }}
          onToast={onToast}
        />
      )}

      {editando && (
        <EditarSocioModal
          socio={editando}
          onClose={() => setEditando(null)}
          onSave={(updated) => { setSocios(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditando(null); onToast('Socio actualizado'); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function NuevoSocioModal({ onClose, onSave, onToast }) {
  const [form, setForm] = React.useState({ nombre: '', edad: '', contacto: '', apoderado_nombre: '', apoderado_telefono: '', apoderado_email: '' });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { onToast('Ingrese el nombre'); return; }
    setSaving(true);
    try {
      const socio = await api.createParticipant({
        nombre:             form.nombre.trim(),
        edad:               form.edad ? Number(form.edad) : null,
        contacto:           form.contacto || null,
        apoderado_nombre:   form.apoderado_nombre || null,
        apoderado_telefono: form.apoderado_telefono || null,
        apoderado_email:    form.apoderado_email || null,
      });
      onSave(socio);
    } catch (e) {
      onToast('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: 20,
    }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.plus size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nuevo integrante</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Registrar socio</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}>
            <Icon.x size={18}/>
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo</div>
            <input className="input" placeholder="Ej. María González" autoFocus
              value={form.nombre} onChange={e => set('nombre', e.target.value)}/>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Edad</div>
              <input className="input tnum" placeholder="—" type="number" min="1" max="120"
                value={form.edad} onChange={e => set('edad', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Contacto</div>
              <input className="input" placeholder="Teléfono o email"
                value={form.contacto} onChange={e => set('contacto', e.target.value)}/>
            </label>
          </div>
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Datos del apoderado</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre del apoderado</div>
                <input className="input" placeholder="Ej. Carlos González"
                  value={form.apoderado_nombre} onChange={e => set('apoderado_nombre', e.target.value)}/>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Teléfono</div>
                  <input className="input" placeholder="+54 11 5555-5555"
                    value={form.apoderado_telefono} onChange={e => set('apoderado_telefono', e.target.value)}/>
                </label>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Correo</div>
                  <input className="input" type="email" placeholder="apoderado@mail.com"
                    value={form.apoderado_email} onChange={e => set('apoderado_email', e.target.value)}/>
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Guardando…' : 'Registrar socio'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditarSocioModal({ socio, onClose, onSave, onToast }) {
  const [form, setForm] = React.useState({
    nombre: socio.nombre, edad: socio.edad || '', contacto: socio.contacto || '', estado: socio.estado,
    apoderado_nombre: socio.apoderado_nombre || '', apoderado_telefono: socio.apoderado_telefono || '', apoderado_email: socio.apoderado_email || '',
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { onToast('Ingrese el nombre'); return; }
    setSaving(true);
    try {
      const updated = await api.updateParticipant(socio.id, {
        nombre: form.nombre.trim(), edad: form.edad ? Number(form.edad) : null,
        contacto: form.contacto || null, estado: form.estado,
        apoderado_nombre: form.apoderado_nombre || null,
        apoderado_telefono: form.apoderado_telefono || null,
        apoderado_email: form.apoderado_email || null,
      });
      onSave(updated);
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon.edit size={18}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Editar integrante</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>{socio.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo</div>
            <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)}/>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Edad</div>
              <input className="input tnum" type="number" min="1" max="120" value={form.edad} onChange={e => set('edad', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Estado</div>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
                <option value="activo">activo</option>
                <option value="inactivo">inactivo</option>
              </select>
            </label>
          </div>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Contacto</div>
            <input className="input" placeholder="Teléfono o email" value={form.contacto} onChange={e => set('contacto', e.target.value)}/>
          </label>
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Datos del apoderado</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre del apoderado</div>
                <input className="input" placeholder="Ej. Carlos González"
                  value={form.apoderado_nombre} onChange={e => set('apoderado_nombre', e.target.value)}/>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Teléfono</div>
                  <input className="input" placeholder="+54 11 5555-5555"
                    value={form.apoderado_telefono} onChange={e => set('apoderado_telefono', e.target.value)}/>
                </label>
                <label>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Correo</div>
                  <input className="input" type="email" placeholder="apoderado@mail.com"
                    value={form.apoderado_email} onChange={e => set('apoderado_email', e.target.value)}/>
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: TALLERES (gestión de talleres + inscripciones por taller)
// ═══════════════════════════════════════════════════════════════
function AdminTalleres({ onToast }) {
  const [talleres, setTalleres] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [modal, setModal] = React.useState(false);

  React.useEffect(() => {
    api.adminGetWorkshops().then(setTalleres).catch(() => {});
  }, []);

  if (selected) {
    return (
      <TallerDetalle
        taller={selected}
        onBack={() => setSelected(null)}
        onUpdateTaller={(t) => setTalleres(prev => prev.map(x => x.id === t.id ? t : x))}
        onToast={onToast}
      />
    );
  }

  const handleDelete = async (t, e) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar el taller "${t.nombre}"? Se perderán todas sus inscripciones.`)) return;
    try {
      await api.adminDeleteWorkshop(t.id);
      setTalleres(prev => prev.filter(x => x.id !== t.id));
      onToast('Taller eliminado');
    } catch (err) { onToast('Error: ' + err.message); }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Talleres</h1>
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Icon.plus size={14}/> Nuevo taller
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Talleres" value={talleres.length}/>
        <Kpi label="Inscripciones" value={talleres.reduce((a, t) => a + (t.inscritos || 0), 0)}/>
        <Kpi label="Cupo disponible" value={talleres.reduce((a, t) => a + Math.max(0, (t.cupo || 0) - (t.inscritos || 0)), 0)}/>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Taller', 'Disciplina', 'Horario', 'Profesor', 'Inscritos', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {talleres.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin talleres. Crea el primero.</td></tr>
            )}
            {talleres.map((t, i) => (
              <tr key={t.id} onClick={() => setSelected(t)} style={{ borderBottom: i < talleres.length - 1 ? '1px solid var(--line)' : 0, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color || 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {t.emoji || '🏃'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.nombre}</div>
                      {t.sede && <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t.sede}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}><span className="pill pill-muted">{t.disciplina}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink-2)' }}>{t.horario || '—'}{t.hora ? ' · ' + t.hora : ''}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-2)' }}>{t.profesor_nombre || <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>Sin asignar</span>}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>{t.inscritos || 0}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>/ {t.cupo || 20}</span>
                    <div style={{ width: 50, height: 5, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((t.inscritos||0)/(t.cupo||20))*100)}%`, background: 'var(--accent)', borderRadius: 999 }}/>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); setSelected(t); }}>Gestionar</Button>
                    <Button size="sm" variant="danger" onClick={e => handleDelete(t, e)}><Icon.x size={12}/></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <NuevoTallerModal
          onClose={() => setModal(false)}
          onSave={(t) => { setTalleres(prev => [...prev, t]); setModal(false); onToast('Taller creado · ' + t.nombre); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function TallerDetalle({ taller: tallerInicial, onBack, onUpdateTaller, onToast }) {
  const [taller, setTaller] = React.useState(tallerInicial);
  const [tab, setTab] = React.useState('inscritos');
  const [inscritos, setInscritos] = React.useState([]);
  const [disponibles, setDisponibles] = React.useState([]);
  const [historial, setHistorial] = React.useState([]);
  const [pagosData, setPagosData] = React.useState({ pagos: [], sinPago: [] });
  const [selectedPid, setSelectedPid] = React.useState('');
  const [monto, setMonto] = React.useState('');
  const [metodo, setMetodo] = React.useState('Transferencia');
  const [adding, setAdding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);

  React.useEffect(() => {
    api.adminGetTallerInscriptions(taller.id).then(setInscritos).catch(() => {});
    api.adminGetTallerAvailable(taller.id).then(setDisponibles).catch(() => {});
  }, [taller.id]);

  React.useEffect(() => {
    if (tab === 'asistencia' && historial.length === 0)
      api.getAttendanceHistory(taller.id).then(setHistorial).catch(() => {});
    if (tab === 'pagos' && pagosData.pagos.length === 0 && pagosData.sinPago.length === 0)
      api.adminGetTallerPayments(taller.id).then(setPagosData).catch(() => {});
  }, [tab]);

  const handleInscribir = async () => {
    if (!selectedPid) { onToast('Seleccioná un socio'); return; }
    setSaving(true);
    try {
      const ins = await api.adminCreateTallerInscription(taller.id, { participante_id: selectedPid, monto: monto ? Number(monto) : null, metodo_pago: metodo });
      setInscritos(prev => [...prev, ins]);
      setDisponibles(prev => prev.filter(p => p.id !== selectedPid));
      setSelectedPid(''); setMonto(''); setAdding(false);
      onToast('Inscripción creada');
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  const handleDesinscribir = async (ins) => {
    if (!confirm(`¿Desinscribir a ${ins.nombre}?`)) return;
    try {
      await api.adminDeleteTallerInscription(taller.id, ins.inscripcion_id);
      setInscritos(prev => prev.filter(i => i.inscripcion_id !== ins.inscripcion_id));
      setDisponibles(prev => [...prev, { id: ins.participante_id, nombre: ins.nombre, edad: ins.edad, iniciales: ins.iniciales, avatar_bg: ins.avatar_bg }]);
      onToast('Inscripción eliminada');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const [pagoModal, setPagoModal] = React.useState(null); // { participante_id, nombre, iniciales, avatar_bg, periodo }

  const meses = React.useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()],
      });
    }
    return result;
  }, []);

  const inscritos2 = React.useMemo(() => {
    // Combinar inscritos + pagos para la grilla mensual
    const map = {};
    inscritos.forEach(p => { map[p.participante_id] = { ...p, mensualidades: {} }; });
    pagosData.pagos.forEach(pg => {
      if (pg.periodo && map[pg.participante_id]) {
        map[pg.participante_id].mensualidades[pg.periodo] = pg;
      }
    });
    return Object.values(map);
  }, [inscritos, pagosData.pagos]);

  const estadoPagoColor = e => ({ pagado: 'present', pendiente: 'late', vencido: 'absent' }[e] || 'muted');

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'var(--font-ui)' }}>
          <Icon.chevronLeft size={16}/> Talleres
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Detalle del taller</div>
          <h1 className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{taller.emoji || '🏃'}</span> {taller.nombre}
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}><Icon.edit size={14}/> Editar</Button>
        {tab === 'inscritos' && (
          <Button size="sm" onClick={() => setAdding(a => !a)}>
            <Icon.plus size={14}/> Inscribir socio
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Inscritos"       value={inscritos.length}/>
        <Kpi label="Cupo total"      value={taller.cupo || 20}/>
        <Kpi label="Clases dictadas" value={historial.length || '—'}/>
        <Kpi label="Asist. promedio" value={historial.length ? Math.round(historial.reduce((a,h)=>a+(h.total>0?h.presentes/h.total:0),0)/historial.length*100)+'%' : '—'}/>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 14, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
        {[['inscritos','Inscritos'],['asistencia','Asistencia'],['pagos','Pagos']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 7, border: 0, cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
            background: tab === id ? 'var(--bg)' : 'transparent',
            color: tab === id ? 'var(--ink)' : 'var(--ink-3)',
            boxShadow: tab === id ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease',
          }}>{label}</button>
        ))}
      </div>

      {/* ── TAB: INSCRITOS ── */}
      {tab === 'inscritos' && (
        <>
          {adding && (
            <div className="card" style={{ padding: 18, marginBottom: 14, borderLeft: '3px solid var(--accent)' }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Inscribir socio</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Socio</div>
                  <select className="input" value={selectedPid} onChange={e => setSelectedPid(e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {disponibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Monto</div>
                  <input className="input tnum" type="number" placeholder="$ 0" value={monto} onChange={e => setMonto(e.target.value)}/>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Método</div>
                  <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>
                    {['Transferencia','Tarjeta','Efectivo','Mercado Pago'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <Button onClick={handleInscribir} disabled={saving || !selectedPid} style={{ alignSelf: 'flex-end' }}>
                  {saving ? 'Guardando…' : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
              <div className="eyebrow" style={{ flex: 1 }}>Inscritos · {taller.horario || 'Sin horario'}</div>
              {taller.profesor_nombre && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Profesor: {taller.profesor_nombre}</span>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
              <thead><tr style={{ background: 'var(--surface-2)' }}>
                {['Socio','Edad','Estado','Monto','Método',''].map((h,i) => (
                  <th key={i} style={{ textAlign: i===3?'right':'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {inscritos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin inscritos. Usá "Inscribir socio".</td></tr>}
                {inscritos.map((ins, i) => (
                  <tr key={ins.inscripcion_id} style={{ borderBottom: i < inscritos.length-1 ? '1px solid var(--line)' : 0 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={ins.nombre} bg={ins.avatar_bg} initials={ins.iniciales} size={32}/>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{ins.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-2)' }} className="tnum">{ins.edad || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><span className={`pill pill-${ins.estado==='confirmada'?'present':ins.estado==='cancelada'?'absent':'late'}`}>{ins.estado}</span></td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }} className="tnum">{ins.monto ? `$ ${Number(ins.monto).toLocaleString('es-AR')}` : '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-2)' }}>{ins.metodo_pago || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button size="sm" variant="danger" onClick={() => handleDesinscribir(ins)}>Quitar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB: ASISTENCIA ── */}
      {tab === 'asistencia' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
            <div className="eyebrow">Historial de clases</div>
          </div>
          {historial.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Sin clases registradas aún.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
              <thead><tr style={{ background: 'var(--surface-2)' }}>
                {['Fecha','Presentes','Ausentes','Total','Asistencia'].map((h,i) => (
                  <th key={i} style={{ textAlign: i>0?'center':'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {historial.map((h, i) => {
                  const pct = h.total > 0 ? Math.round((h.presentes / h.total) * 100) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: i < historial.length-1 ? '1px solid var(--line)' : 0 }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatDateES(h.fecha)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--present)', fontWeight: 700 }} className="tnum">{h.presentes}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--absent)' }} className="tnum">{h.ausentes}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--ink-3)' }} className="tnum">{h.total}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct>=80?'var(--present)':pct>=60?'var(--late)':'var(--absent)', borderRadius: 999 }}/>
                          </div>
                          <span className="tnum" style={{ fontSize: 12, fontWeight: 700, minWidth: 34, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: PAGOS ── */}
      {tab === 'pagos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="eyebrow" style={{ flex: 1 }}>Mensualidades · {taller.nombre}</div>
            <span className="pill pill-present">{pagosData.pagos.filter(p=>p.estado==='pagado').length} pagados</span>
            <span className="pill pill-absent">{inscritos.length - new Set(pagosData.pagos.filter(p=>p.periodo===meses[meses.length-1].key).map(p=>p.participante_id)).size} sin pagar este mes</span>
          </div>

          {inscritos2.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Sin inscritos en este taller.</div>
          ) : (
            <>
              {/* Cabecera de meses */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Alumno</div>
                {meses.map(m => (
                  <div key={m.key} style={{ width: 40, textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)' }}>{m.label}</div>
                ))}
              </div>

              {inscritos2.map((alumno, i) => (
                <div key={alumno.participante_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: i < inscritos2.length - 1 ? '1px solid var(--line)' : 0 }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={alumno.nombre} bg={alumno.avatar_bg} initials={alumno.iniciales} size={28}/>
                    <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alumno.nombre}</span>
                  </div>
                  {meses.map(m => {
                    const pg = alumno.mensualidades[m.key];
                    const border = pg ? ({ pagado: 'var(--present)', pendiente: 'var(--late)', vencido: 'var(--absent)' }[pg.estado] || 'var(--line)') : 'var(--line-2)';
                    const bg     = pg ? ({ pagado: 'var(--present-soft)', pendiente: 'var(--late-soft)', vencido: 'var(--absent-soft)' }[pg.estado] || 'var(--surface-2)') : 'var(--surface-2)';
                    return (
                      <button key={m.key}
                        title={pg ? `${pg.concepto} · $${Number(pg.monto).toLocaleString('es-AR')} · ${pg.estado}` : `Registrar pago ${m.label}`}
                        onClick={() => !pg && setPagoModal({ participante_id: alumno.participante_id, nombre: alumno.nombre, iniciales: alumno.iniciales, avatar_bg: alumno.avatar_bg, periodo: m.key, mesLabel: m.label })}
                        style={{
                          width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${border}`,
                          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, cursor: pg ? 'default' : 'pointer',
                          fontFamily: 'var(--font-ui)',
                        }}>
                        {pg ? (
                          pg.estado === 'pagado'  ? <Icon.check size={15} style={{ color: 'var(--present)' }}/> :
                          pg.estado === 'vencido' ? <Icon.x size={15} style={{ color: 'var(--absent)' }}/> :
                          <Icon.clock size={15} style={{ color: 'var(--late)' }}/>
                        ) : (
                          <Icon.plus size={13} style={{ color: 'var(--ink-3)' }}/>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* ── Fila de totales por mes ── */}
              {(() => {
                const mesActualKey = meses[meses.length - 1]?.key;
                const totales = meses.map(m => ({
                  pagados:   inscritos2.filter(a => a.mensualidades[m.key]?.estado === 'pagado').length,
                  pendientes: inscritos2.filter(a => !a.mensualidades[m.key]).length,
                  monto:     inscritos2.reduce((s, a) => s + (a.mensualidades[m.key]?.estado === 'pagado' ? Number(a.mensualidades[m.key].monto) : 0), 0),
                }));
                const totalRecaudado = totales.reduce((s, t) => s + t.monto, 0);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '2px solid var(--line)', background: 'color-mix(in oklab, var(--ink) 4%, var(--surface-2))' }}>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)' }}>Totales</div>
                    {totales.map((t, i) => (
                      <div key={meses[i].key} style={{
                        width: 40, height: 46, borderRadius: 10, flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: meses[i].key === mesActualKey ? 'var(--accent-soft)' : 'var(--surface-2)',
                        border: `1.5px solid ${meses[i].key === mesActualKey ? 'var(--accent)' : 'var(--line)'}`,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--present)' }}>{t.pagados}✓</span>
                        {t.pendientes > 0 && <span style={{ fontSize: 9, color: 'var(--absent)' }}>{t.pendientes}✗</span>}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── Resumen global ── */}
              {(() => {
                const totalPagados = inscritos2.filter(a => Object.values(a.mensualidades).some(pg => pg?.estado === 'pagado')).length;
                const pendientesMesActual = inscritos2.filter(a => !a.mensualidades[meses[meses.length - 1]?.key]).length;
                const totalRecaudado = inscritos2.reduce((s, a) =>
                  s + Object.values(a.mensualidades).reduce((ms, pg) => ms + (pg?.estado === 'pagado' ? Number(pg.monto) : 0), 0), 0);
                return (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-3)' }}>Pendientes este mes: </span>
                        <span style={{ fontWeight: 700, color: pendientesMesActual > 0 ? 'var(--absent)' : 'var(--present)' }}>{pendientesMesActual}</span>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-3)' }}>Recaudado ({meses.length} meses): </span>
                        <span className="tnum" style={{ fontWeight: 700 }}>$ {totalRecaudado.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {[['var(--present)','var(--present-soft)','Pagado'],['var(--late)','var(--late-soft)','Pendiente'],['var(--absent)','var(--absent-soft)','Vencido'],['var(--line-2)','var(--surface-2)','+Registrar']].map(([c, bg, label]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 4, border: `1.5px solid ${c}`, background: bg }}/>
                          <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Modal registrar mensualidad */}
      {pagoModal && (
        <RegistrarMensualidadModal
          info={pagoModal}
          tallerId={taller.id}
          onClose={() => setPagoModal(null)}
          onSave={(pg) => {
            setPagosData(prev => ({ ...prev, pagos: [pg, ...prev.pagos] }));
            setPagoModal(null);
            onToast(`Pago registrado · ${pagoModal.nombre.split(' ')[0]}`);
          }}
          onToast={onToast}
        />
      )}

      {editModal && (
        <NuevoTallerModal
          taller={taller}
          onClose={() => setEditModal(false)}
          onSave={(updated) => { setTaller(updated); onUpdateTaller(updated); setEditModal(false); onToast('Taller actualizado'); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function NuevoTallerModal({ taller, onClose, onSave, onToast }) {
  const editing = !!taller;
  const [form, setForm] = React.useState({
    nombre: taller?.nombre || '', disciplina: taller?.disciplina || '',
    emoji: taller?.emoji || '🏃', horario: taller?.horario || '',
    hora: taller?.hora || '', cupo: taller?.cupo || 20, sede: taller?.sede || '',
    profesor_id: taller?.profesor_id || '',
  });
  const [profesores, setProfesores] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    api.getProfessors().then(data => setProfesores(data || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.disciplina.trim()) { onToast('Nombre y disciplina son obligatorios'); return; }
    setSaving(true);
    try {
      let result;
      if (editing) {
        await api.adminUpdateWorkshop(taller.id, form);
        const prof = profesores.find(p => p.id == form.profesor_id);
        result = { ...taller, ...form, profesor_nombre: prof?.nombre || taller.profesor_nombre };
      } else {
        result = await api.adminCreateWorkshop(form);
      }
      onSave(result);
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  const emojis = ['⚽','🏀','🏊','🎾','🥋','🏃','🤸','🎯','🏋️','🤼','🎭','🎨'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 500, maxWidth: '100%', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {form.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{editing ? 'Editar taller' : 'Nuevo taller'}</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>{editing ? form.nombre : 'Crear taller'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Ícono</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {emojis.map(e => (
                <button key={e} onClick={() => set('emoji', e)} style={{
                  width: 36, height: 36, borderRadius: 8, border: form.emoji === e ? '2px solid var(--accent)' : '1px solid var(--line)',
                  background: form.emoji === e ? 'var(--accent-soft)' : 'var(--surface-2)',
                  fontSize: 18, cursor: 'pointer',
                }}>{e}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre</div>
              <input className="input" placeholder="Ej. Fútbol Sub-15" value={form.nombre} onChange={e => set('nombre', e.target.value)} autoFocus={!editing}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Disciplina</div>
              <input className="input" placeholder="Ej. Fútbol" value={form.disciplina} onChange={e => set('disciplina', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Horario</div>
              <input className="input" placeholder="Lun y Mié" value={form.horario} onChange={e => set('horario', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Hora</div>
              <input className="input" placeholder="18:00" value={form.hora} onChange={e => set('hora', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Cupo máximo</div>
              <input className="input tnum" type="number" min="1" value={form.cupo} onChange={e => set('cupo', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Sede</div>
              <input className="input" placeholder="Ej. Sede Central" value={form.sede} onChange={e => set('sede', e.target.value)}/>
            </label>
          </div>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Profesor asignado</div>
            <select className="input" value={form.profesor_id} onChange={e => set('profesor_id', e.target.value)}>
              <option value="">Sin asignar</option>
              {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear taller'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrarMensualidadModal({ info, tallerId, onClose, onSave, onToast }) {
  const [monto, setMonto] = React.useState('');
  const [metodo, setMetodo] = React.useState('Transferencia');
  const [saving, setSaving] = React.useState(false);

  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const [anio, mes] = info.periodo.split('-');
  const mesLabel = `${MESES_ES[Number(mes) - 1]} ${anio}`;

  const handleSave = async () => {
    if (!monto || Number(monto) <= 0) { onToast('Ingresá el monto'); return; }
    setSaving(true);
    try {
      const pg = await api.registerPayment({
        participante_id: info.participante_id,
        taller_id: tallerId,
        monto: Number(monto),
        metodo,
        periodo: info.periodo,
        concepto: `Mensualidad ${mesLabel}`,
      });
      onSave({ ...pg, periodo: info.periodo });
    } catch(e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={info.nombre} bg={info.avatar_bg} initials={info.iniciales} size={40}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mensualidad</div>
            <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>{info.nombre.split(' ')[0]} · {mesLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Monto</div>
            <input className="input tnum" type="number" placeholder="$ 0" value={monto} onChange={e => setMonto(e.target.value)} autoFocus/>
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Método de pago</div>
            <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>
              {['Transferencia','Efectivo','Tarjeta','Mercado Pago'].map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Registrar pago'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NuevaInscripcionModal({ talleres, participantes: participantesProp, onClose, onSave, onNuevoSocio, onToast }) {
  const [form, setForm] = React.useState({ participante_id: '', taller_id: '', monto: '', metodo_pago: 'Transferencia' });
  const [saving, setSaving] = React.useState(false);
  const [subModal, setSubModal] = React.useState(false);
  const [participantes, setParticipantes] = React.useState(participantesProp || []);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.participante_id || !form.taller_id) { onToast('Seleccione participante y taller'); return; }
    setSaving(true);
    try {
      const nueva = await api.createInscription({
        participante_id: form.participante_id,
        taller_id:       form.taller_id,
        monto:           form.monto ? Number(form.monto) : null,
        metodo_pago:     form.metodo_pago || null,
      });
      onSave(nueva);
    } catch (e) {
      onToast('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2500, padding: 20,
    }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.edit size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Módulo inscripción</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Nueva inscripción</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}>
            <Icon.x size={18}/>
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div className="eyebrow">Participante</div>
              <button onClick={() => setSubModal(true)} style={{ background: 'none', border: 0, color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                ＋ Registrar nuevo socio
              </button>
            </div>
            <select className="input" value={form.participante_id} onChange={e => set('participante_id', e.target.value)}>
              <option value="">Seleccionar socio…</option>
              {participantes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Taller</div>
            <select className="input" value={form.taller_id} onChange={e => set('taller_id', e.target.value)}>
              <option value="">Seleccionar taller…</option>
              {talleres.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Monto (opcional)</div>
              <input className="input tnum" placeholder="$ 0" type="number"
                value={form.monto} onChange={e => set('monto', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Método de pago</div>
              <select className="input" value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)}>
                {['Transferencia','Tarjeta','Efectivo','Mercado Pago'].map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Guardando…' : 'Crear inscripción'}
            </Button>
          </div>
        </div>
      </div>

      {subModal && (
        <NuevoSocioModal
          onClose={() => setSubModal(false)}
          onSave={(socio) => {
            setParticipantes(prev => [...prev, socio]);
            set('participante_id', socio.id);
            if (onNuevoSocio) onNuevoSocio(socio);
            setSubModal(false);
            onToast('Socio registrado · ' + socio.nombre);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: PROFESORES (con generador de link)
// ═══════════════════════════════════════════════════════════════
function AdminProfesores({ onToast }) {
  const [profesores, setProfesores] = React.useState(PROFESORES_ADMIN || []);
  const [links, setLinks] = React.useState({ ...INITIAL_LINKS });
  const [talleres, setTalleres] = React.useState([]);
  const [vista, setVista] = React.useState('lista');
  const [linkModal, setLinkModal] = React.useState(null);
  const [nuevoModal, setNuevoModal] = React.useState(false);
  const [inviteModal, setInviteModal] = React.useState(false);
  const [asignarModal, setAsignarModal] = React.useState(null);
  const [integrantesModal, setIntegrantesModal] = React.useState(null);
  const [editarModal, setEditarModal] = React.useState(null);

  React.useEffect(() => {
    api.getProfessors().then(data => {
      setProfesores(data.map(p => ({
        ...p, bg: p.avatar_bg, iniciales: p.iniciales, disciplinas: p.disciplinas || []
      })));
      const linkMap = {};
      data.forEach(p => { if (p.link?.activo) linkMap[p.id] = { token: p.link.token, expira: p.link.expires_at?.slice(0,10), activo: true, permanent: !!p.link.permanent }; });
      setLinks(prev => ({ ...prev, ...linkMap }));
    }).catch(() => {});
    api.adminGetWorkshops().then(setTalleres).catch(() => {});
  }, []);

  const generateLink = async (profesor, opts = { dias: 7, permanent: false }) => {
    try {
      const data = await api.generateMagicLink(profesor.id, opts);
      const expiraISO = data.expires_at.slice(0, 10);
      setLinks(prev => ({ ...prev, [profesor.id]: { token: data.token, expira: expiraISO, activo: true, usos: 0, permanent: !!data.permanent } }));
      setLinkModal({
        profesor,
        token: data.token,
        url: `${window.location.origin}/api/auth/magic-link/${data.token}`,
        expira: expiraISO,
        permanent: !!data.permanent,
        dias: opts.dias || 7,
        copied: false,
      });
      onToast('Enlace generado');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const revokeLink = async (profesorId) => {
    try {
      await api.revokeMagicLink(profesorId);
      setLinks(prev => ({ ...prev, [profesorId]: { ...prev[profesorId], activo: false } }));
      onToast('Enlace revocado');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const deleteProfesor = async (id, nombre) => {
    if (!confirm(`¿Eliminar al profesor ${nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteProfessor(id);
      setProfesores(prev => prev.filter(p => p.id !== id));
      setLinks(prev => { const n = { ...prev }; delete n[id]; return n; });
      onToast('Profesor eliminado');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const stats = {
    total: profesores.length,
    activos: profesores.filter(p => p.estado === 'activo').length,
    pendientes: profesores.filter(p => p.estado === 'pendiente').length,
    conLink: Object.values(links).filter(l => l.activo).length,
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Profesores</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
            {[['lista','Lista'],['agenda','Agenda']].map(([id, label]) => (
              <button key={id} onClick={() => setVista(id)} style={{
                padding: '6px 14px', borderRadius: 7, border: 0, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                background: vista === id ? 'var(--bg)' : 'transparent',
                color: vista === id ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: vista === id ? 'var(--shadow-sm)' : 'none',
              }}>{label}</button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setInviteModal(true)}><Icon.mail size={14}/> Invitar</Button>
          <Button size="sm" onClick={() => setNuevoModal(true)}><Icon.plus size={14}/> Agregar profesor</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <Kpi label="Profesores" value={stats.total}/>
        <Kpi label="Activos" value={stats.activos}/>
        <Kpi label="Pendientes" value={stats.pendientes}/>
        <Kpi label="Links activos" value={stats.conLink}/>
      </div>

      {vista === 'lista' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Profesor', 'Disciplinas', 'Talleres asignados', 'Estado', 'Enlace de acceso', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profesores.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin profesores. Agregá el primero.</td></tr>
              )}
              {profesores.map((p, i, arr) => {
                const link = links[p.id];
                const tieneLink = link && link.activo;
                const misTalleres = talleres.filter(t => t.profesor_id === p.id);
                return (
                  <tr key={p.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 0 }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={p.nombre} bg={p.bg || p.avatar_bg} initials={p.iniciales} size={36}/>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nombre}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(p.disciplinas || []).map(d => <span key={d} className="pill pill-muted">{d}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {misTalleres.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {misTalleres.map(t => (
                            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: t.color || 'var(--accent-soft)', fontSize: 11.5, fontWeight: 600 }}>
                              {t.emoji} {t.nombre}
                            </span>
                          ))}
                          <button onClick={() => setAsignarModal(p)} style={{ background: 'none', border: 0, color: 'var(--accent)', fontSize: 12, cursor: 'pointer', padding: '2px 4px' }}>editar</button>
                        </div>
                      ) : (
                        <button onClick={() => setAsignarModal(p)} style={{ background: 'none', border: '1px dashed var(--line)', borderRadius: 6, color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer', padding: '4px 10px' }}>
                          + Asignar taller
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`pill pill-${p.estado === 'activo' ? 'present' : p.estado === 'pendiente' ? 'late' : 'muted'}`}>
                        <span className="dot" style={{ background: 'currentColor' }}/>{p.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {tieneLink ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
                            {maskToken(link.token)}
                          </div>
                          <div style={{ fontSize: 11, color: link.permanent ? 'var(--present)' : 'var(--ink-3)' }}>
                            {link.permanent ? '∞ Sin vencimiento' : `Expira ${formatDateES(link.expira)}`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>Sin enlace activo</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" onClick={() => setEditarModal(p)}><Icon.edit size={13}/> Editar</Button>
                        {tieneLink ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setLinkModal({
                              profesor: p, token: link.token,
                              url: `${window.location.origin}/api/auth/magic-link/${link.token}`,
                              expira: link.expira, permanent: !!link.permanent, dias: 7, copied: false,
                            })}><Icon.link size={13}/> Acceso</Button>
                            <Button size="sm" variant="danger" onClick={() => revokeLink(p.id)}>Revocar</Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => generateLink(p)}><Icon.link size={13}/> Generar link</Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => deleteProfesor(p.id, p.nombre)}><Icon.x size={13}/></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'agenda' && (
        <AgendaView
          talleres={talleres}
          profesores={profesores}
          onVerIntegrantes={setIntegrantesModal}
        />
      )}

      {linkModal && (
        <LinkModal
          data={linkModal}
          onClose={() => setLinkModal(null)}
          onCopy={() => { copyToClipboard(linkModal.url); onToast('Enlace copiado'); setLinkModal(m => ({ ...m, copied: true })); }}
          onRegenerate={(opts) => generateLink(linkModal.profesor, opts)}
        />
      )}

      {asignarModal && (
        <AsignarTalleresModal
          profesor={asignarModal}
          talleres={talleres}
          onClose={() => setAsignarModal(null)}
          onSave={(nuevosTalleres) => {
            setTalleres(nuevosTalleres);
            setProfesores(prev => prev.map(p => p.id === asignarModal.id
              ? { ...p, talleres: nuevosTalleres.filter(t => t.profesor_id === p.id).length }
              : p
            ));
            setAsignarModal(null);
            onToast('Talleres actualizados');
          }}
          onToast={onToast}
        />
      )}

      {integrantesModal && (
        <TallerIntegrantesModal
          taller={integrantesModal}
          onClose={() => setIntegrantesModal(null)}
        />
      )}

      {editarModal && (
        <EditarProfesorModal
          profesor={editarModal}
          onClose={() => setEditarModal(null)}
          onSave={(updated) => {
            setProfesores(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated, bg: updated.avatar_bg || p.bg } : p));
            setEditarModal(null);
            onToast('Profesor actualizado');
          }}
          onToast={onToast}
        />
      )}

      {nuevoModal && (
        <AgregarProfesorModal
          onClose={() => setNuevoModal(false)}
          onSave={(nuevo, genLink) => {
            setProfesores(prev => [...prev, { ...nuevo, bg: nuevo.avatar_bg, disciplinas: nuevo.disciplinas || [] }]);
            setNuevoModal(false);
            onToast('Profesor agregado · ' + nuevo.nombre);
            if (genLink) setTimeout(() => generateLink(nuevo), 300);
          }}
          onToast={onToast}
        />
      )}

      {inviteModal && (
        <AgregarProfesorModal
          autoLink
          onClose={() => setInviteModal(false)}
          onSave={(nuevo) => {
            setProfesores(prev => [...prev, { ...nuevo, bg: nuevo.avatar_bg, disciplinas: nuevo.disciplinas || [] }]);
            setInviteModal(false);
            generateLink(nuevo);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ── Agenda semanal: talleres por día con profesores
function AgendaView({ talleres, profesores, onVerIntegrantes }) {
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIA_KEY = { 'lun': 'Lun', 'mar': 'Mar', 'mié': 'Mié', 'mie': 'Mié', 'jue': 'Jue', 'vie': 'Vie', 'sáb': 'Sáb', 'sab': 'Sáb', 'dom': 'Dom' };
  const [printModal, setPrintModal] = React.useState(null); // 'dia' | 'mes'

  const parseDias = (horario) => {
    if (!horario) return [];
    return horario.split(/[\s·,]+/).map(s => s.trim().toLowerCase().slice(0, 3))
      .map(s => DIA_KEY[s]).filter(Boolean);
  };

  const byDia = {};
  DIAS.forEach(d => { byDia[d] = []; });
  talleres.forEach(t => {
    parseDias(t.horario).forEach(d => { if (byDia[d]) byDia[d].push(t); });
  });
  DIAS.forEach(d => { byDia[d].sort((a, b) => (a.hora || '').localeCompare(b.hora || '')); });

  const sinProfesor = talleres.filter(t => !t.profesor_id).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <Button variant="secondary" size="sm" onClick={() => setPrintModal('dia')}>
          🖨 Imprimir día
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setPrintModal('mes')}>
          🖨 Imprimir mes
        </Button>
      </div>

      {sinProfesor > 0 && (
        <div style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 8, background: 'var(--late-soft)', border: '1px solid color-mix(in oklab, var(--late) 30%, transparent)', fontSize: 12.5, color: 'var(--late)', fontWeight: 600 }}>
          ⚠ {sinProfesor} taller{sinProfesor > 1 ? 'es' : ''} sin profesor asignado
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {DIAS.map(dia => (
          <div key={dia}>
            <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, borderBottom: '2px solid var(--line)' }}>
              {dia}
              {byDia[dia].length > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>
                  {byDia[dia].length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byDia[dia].length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 20, opacity: 0.3 }}>—</div>
              ) : byDia[dia].map(t => {
                const prof = profesores.find(p => p.id === t.profesor_id);
                return (
                  <button key={t.id} onClick={() => onVerIntegrantes(t)}
                    style={{
                      padding: '10px 10px 8px', borderRadius: 10, border: '1px solid var(--line)',
                      background: t.color ? `color-mix(in oklab, ${t.color} 18%, var(--bg))` : 'var(--accent-soft)',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      fontFamily: 'var(--font-ui)', transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{t.emoji || '🏃'}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{t.nombre}</div>
                    {t.hora && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, fontWeight: 600 }}>{t.hora.split('–')[0].trim()}</div>}
                    {t.sede && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.sede}</div>}
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {prof ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Avatar name={prof.nombre} bg={prof.bg || prof.avatar_bg} initials={prof.iniciales} size={18}/>
                          <span style={{ fontSize: 10, color: 'var(--ink-2)', fontWeight: 600 }}>{prof.nombre.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--absent)', fontWeight: 600 }}>Sin profesor</span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.inscritos || 0} 👥</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {printModal && (
        <PrintAgendaModal
          modo={printModal}
          talleres={talleres}
          profesores={profesores}
          byDia={byDia}
          DIAS={DIAS}
          onClose={() => setPrintModal(null)}
        />
      )}
    </div>
  );
}

function PrintAgendaModal({ modo, talleres, profesores, byDia, DIAS, onClose }) {
  const [diaSeleccionado, setDiaSeleccionado] = React.useState(DIAS[0]);
  const [loading, setLoading] = React.useState(false);
  const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const hoy = new Date();
  const mesLabel = MESES_ES[hoy.getMonth()] + ' ' + hoy.getFullYear();

  const generarHTML = (talleresConInscritos) => {
    const rows = talleresConInscritos.map(({ taller, inscritos, prof }) => {
      const listaIntegrantes = inscritos.length > 0
        ? inscritos.map((ins, idx) => `
            <tr style="background:${idx%2===0?'#f9f9f9':'#fff'}">
              <td style="padding:5px 10px">${idx + 1}</td>
              <td style="padding:5px 10px;font-weight:600">${ins.nombre}</td>
              <td style="padding:5px 10px;color:#666">${ins.edad ? ins.edad + ' años' : '—'}</td>
              <td style="padding:5px 10px">
                <span style="padding:2px 8px;border-radius:4px;font-size:11px;background:${ins.estado==='confirmada'?'#d4f7e0':ins.estado==='cancelada'?'#fde8e8':'#fef3cd'};color:${ins.estado==='confirmada'?'#166534':ins.estado==='cancelada'?'#991b1b':'#92400e'}">${ins.estado}</span>
              </td>
            </tr>`).join('')
        : `<tr><td colspan="4" style="padding:10px;text-align:center;color:#999;font-style:italic">Sin integrantes registrados</td></tr>`;

      return `
        <div style="margin-bottom:28px;break-inside:avoid">
          <div style="background:#1a1a2e;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">${taller.emoji || '🏃'}</span>
            <div style="flex:1">
              <div style="font-size:16px;font-weight:700">${taller.nombre}</div>
              <div style="font-size:12px;color:#aaa;margin-top:2px">
                ${taller.horario || '—'} · ${taller.hora || ''} · ${taller.sede || ''}
              </div>
            </div>
            <div style="text-align:right;font-size:12px">
              <div style="font-size:20px;font-weight:700">${inscritos.length}</div>
              <div style="color:#aaa">integrantes</div>
            </div>
          </div>
          <div style="padding:8px 16px;background:#f0f0f5;border:1px solid #e0e0e0;border-top:0;font-size:12px;color:#555">
            <b>Profesor:</b> ${prof ? prof.nombre : 'Sin asignar'}
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e0e0e0;border-top:0">
            <thead>
              <tr style="background:#e8e8f0">
                <th style="padding:6px 10px;text-align:left;font-size:11px;width:32px">#</th>
                <th style="padding:6px 10px;text-align:left;font-size:11px">Nombre</th>
                <th style="padding:6px 10px;text-align:left;font-size:11px;width:70px">Edad</th>
                <th style="padding:6px 10px;text-align:left;font-size:11px;width:90px">Estado</th>
              </tr>
            </thead>
            <tbody>${listaIntegrantes}</tbody>
          </table>
        </div>`;
    }).join('');

    const titulo = modo === 'dia'
      ? `Agenda del día — ${diaSeleccionado}`
      : `Agenda mensual — ${mesLabel}`;

    return `<!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8"/>
      <title>${titulo}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a2e; margin: 0; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
        @media print {
          body { padding: 12px; }
          .no-print { display: none; }
        }
      </style>
    </head><body>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #1a1a2e">
        <div>
          <h1>${titulo}</h1>
          <div class="subtitle">Generado el ${hoy.toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · ${talleres.length} talleres</div>
        </div>
      </div>
      ${rows}
      <div class="no-print" style="margin-top:24px;text-align:center">
        <button onclick="window.print()" style="padding:10px 28px;background:#1a1a2e;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px">🖨 Imprimir</button>
        <button onclick="window.close()" style="padding:10px 28px;background:#eee;color:#333;border:0;border-radius:8px;font-size:14px;cursor:pointer">Cerrar</button>
      </div>
    </body></html>`;
  };

  const handleImprimir = async () => {
    setLoading(true);
    try {
      const talleresTarget = modo === 'dia' ? (byDia[diaSeleccionado] || []) : talleres;
      const talleresConInscritos = await Promise.all(
        talleresTarget.map(async (t) => {
          const prof = profesores.find(p => p.id === t.profesor_id);
          let inscritos = [];
          try { inscritos = await api.adminGetTallerInscriptions(t.id); } catch {}
          return { taller: t, prof, inscritos };
        })
      );
      const html = generarHTML(talleresConInscritos);
      const w = window.open('', '_blank', 'width=900,height=700');
      w.document.write(html);
      w.document.close();
    } catch (e) {
      alert('Error al generar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{fontSize:18}}>🖨</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Imprimir agenda</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>
              {modo === 'dia' ? 'Por día' : `Mes completo — ${mesLabel}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modo === 'dia' && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Seleccionar día</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DIAS.map(d => (
                  <button key={d} onClick={() => setDiaSeleccionado(d)} style={{
                    flex: 1, minWidth: 44, padding: '8px 4px', borderRadius: 8, border: `1px solid ${diaSeleccionado === d ? 'var(--accent)' : 'var(--line)'}`,
                    background: diaSeleccionado === d ? 'var(--accent-soft)' : 'var(--surface-2)',
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 700,
                    color: diaSeleccionado === d ? 'var(--accent-ink)' : 'var(--ink-2)',
                  }}>
                    {d}
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 400, marginTop: 2 }}>
                      {(byDia[d] || []).length} talleres
                    </div>
                  </button>
                ))}
              </div>
              {(byDia[diaSeleccionado] || []).length === 0 && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center' }}>No hay talleres ese día</div>
              )}
            </div>
          )}
          {modo === 'mes' && (
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Se imprimirán <b>{talleres.length} talleres</b> con sus integrantes completos para el mes de <b>{mesLabel}</b>.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleImprimir} disabled={loading || (modo === 'dia' && (byDia[diaSeleccionado]||[]).length === 0)} style={{ flex: 1 }}>
              {loading ? 'Cargando…' : '🖨 Generar e imprimir'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsignarTalleresModal({ profesor, talleres, onClose, onSave, onToast }) {
  const [seleccionados, setSeleccionados] = React.useState(
    talleres.filter(t => t.profesor_id === profesor.id).map(t => t.id)
  );
  const [saving, setSaving] = React.useState(false);

  const toggle = (id) => setSeleccionados(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = talleres.map(t => {
        const eraAsignado = t.profesor_id === profesor.id;
        const ahoraAsignado = seleccionados.includes(t.id);
        if (eraAsignado === ahoraAsignado) return null;
        return api.adminUpdateWorkshop(t.id, { ...t, profesor_id: ahoraAsignado ? profesor.id : null });
      }).filter(Boolean);
      await Promise.all(promises);
      const nuevosTalleres = talleres.map(t => ({
        ...t,
        profesor_id: seleccionados.includes(t.id) ? profesor.id
          : t.profesor_id === profesor.id ? null
          : t.profesor_id,
        profesor_nombre: seleccionados.includes(t.id) ? profesor.nombre
          : t.profesor_id === profesor.id ? null
          : t.profesor_nombre,
      }));
      onSave(nuevosTalleres);
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', maxHeight: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Avatar name={profesor.nombre} bg={profesor.bg || profesor.avatar_bg} initials={profesor.iniciales} size={40}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Talleres asignados</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>{profesor.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {talleres.length === 0 && <div style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>No hay talleres creados</div>}
          {talleres.map(t => {
            const checked = seleccionados.includes(t.id);
            const otroProf = t.profesor_id && t.profesor_id !== profesor.id;
            return (
              <label key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${checked ? 'var(--accent)' : 'var(--line)'}`,
                background: checked ? 'var(--accent-soft)' : 'var(--surface-2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={checked} onChange={() => toggle(t.id)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}/>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{t.emoji || '🏃'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.nombre}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>
                    {t.horario || '—'}{t.hora ? ' · ' + t.hora : ''}{t.sede ? ' · ' + t.sede : ''}
                  </div>
                  {otroProf && (
                    <div style={{ fontSize: 11, color: 'var(--late)', fontWeight: 600, marginTop: 2 }}>
                      Asignado a: {t.profesor_nombre || 'otro profesor'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                  {t.inscritos || 0} alumnos
                </div>
              </label>
            );
          })}
        </div>
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando…' : `Guardar (${seleccionados.length} talleres)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TallerIntegrantesModal({ taller, onClose }) {
  const [inscritos, setInscritos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.adminGetTallerInscriptions(taller.id)
      .then(setInscritos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taller.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '80vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: taller.color || 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {taller.emoji || '🏃'}
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Integrantes del taller</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>{taller.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', display: 'flex', gap: 16, justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', padding: '6px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }} className="tnum">{inscritos.length}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inscriptos</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }}/>
          <div style={{ textAlign: 'center', padding: '6px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }} className="tnum">{taller.cupo || 20}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cupo</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)' }}/>
          <div style={{ textAlign: 'center', padding: '6px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: inscritos.filter(i=>i.estado==='confirmada').length < (taller.cupo||20) ? 'var(--present)' : 'var(--absent)' }} className="tnum">
              {Math.max(0, (taller.cupo||20) - inscritos.filter(i=>i.estado==='confirmada').length)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disponible</div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>}
          {!loading && inscritos.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin integrantes en este taller.</div>
          )}
          {inscritos.map((ins, i) => (
            <div key={ins.inscripcion_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < inscritos.length - 1 ? '1px solid var(--line)' : 0 }}>
              <Avatar name={ins.nombre} bg={ins.avatar_bg} initials={ins.iniciales} size={34}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{ins.nombre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{ins.edad ? `${ins.edad} años` : '—'}</div>
              </div>
              <span className={`pill pill-${ins.estado==='confirmada'?'present':ins.estado==='cancelada'?'absent':'late'}`}>
                {ins.estado}
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <Button variant="secondary" onClick={onClose} style={{ width: '100%' }}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

function EditarProfesorModal({ profesor, onClose, onSave, onToast }) {
  const disciplinasOpciones = ['Fútbol','Básquet','Natación','Tenis','Atletismo','Artes Marciales','Yoga','Pilates','Vóley'];
  const [form, setForm] = React.useState({
    nombre:     profesor.nombre     || '',
    email:      profesor.email      || '',
    dni:        profesor.dni        || '',
    telefono:   profesor.telefono   || '',
    disciplinas: Array.isArray(profesor.disciplinas)
      ? profesor.disciplinas
      : (profesor.disciplinas ? profesor.disciplinas.split(',').map(s => s.trim()).filter(Boolean) : []),
    estado: (profesor.estado === 'inactivo') ? 'inactivo' : 'activo',
  });
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleDisc = (d) => setForm(f => ({
    ...f,
    disciplinas: f.disciplinas.includes(d) ? f.disciplinas.filter(x => x !== d) : [...f.disciplinas, d],
  }));

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.email.trim()) { onToast('Nombre y email son obligatorios'); return; }
    if (password && password.length < 6) { onToast('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password && password !== passwordConfirm) { onToast('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await api.updateProfessor(profesor.id, {
        nombre:     form.nombre.trim(),
        email:      form.email.trim(),
        dni:        form.dni || null,
        telefono:   form.telefono || null,
        disciplinas: form.disciplinas,
        estado:     form.estado,
      });
      if (password) {
        await api.adminSetProfessorPassword(profesor.id, password);
      }
      onSave({ ...profesor, ...form, id: profesor.id, avatar_bg: profesor.avatar_bg, estado: password ? 'activo' : form.estado });
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.edit size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Editar profesor</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>{profesor.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo</div>
              <input className="input" placeholder="Carlos Méndez" autoFocus value={form.nombre} onChange={e => set('nombre', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
              <input className="input" type="email" placeholder="carlos@club.com" value={form.email} onChange={e => set('email', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>DNI (opcional)</div>
              <input className="input tnum" placeholder="00.000.000" value={form.dni} onChange={e => set('dni', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Teléfono (opcional)</div>
              <input className="input" placeholder="+54 11 0000-0000" value={form.telefono} onChange={e => set('telefono', e.target.value)}/>
            </label>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Disciplinas</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {disciplinasOpciones.map(d => (
                <button key={d} className="tweaks-chip" aria-pressed={form.disciplinas.includes(d)} onClick={() => toggleDisc(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Estado</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['activo','inactivo'].map(op => (
                <button key={op} onClick={() => set('estado', op)} style={{
                  flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.estado === op ? 'var(--accent)' : 'var(--line)',
                  background: form.estado === op ? 'var(--accent-soft)' : 'transparent',
                  color: form.estado === op ? 'var(--accent-ink)' : 'var(--ink-2)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                }}>{op}</button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {profesor.estado === 'pendiente' ? 'Asignar contraseña' : 'Cambiar contraseña'}
            </div>
            {profesor.estado === 'pendiente' && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, lineHeight: 1.4 }}>
                Este profesor aún no tiene contraseña. Asígnale una para que pueda iniciar sesión directamente.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Nueva contraseña</div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="mín. 6 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)}/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}>
                    {showPass ? <Icon.eyeOff size={14}/> : <Icon.eye size={14}/>}
                  </button>
                </div>
              </label>
              <label>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Confirmar contraseña</div>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="repetir contraseña"
                  value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}/>
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              Deja vacío si no deseas cambiar la contraseña.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgregarProfesorModal({ autoLink, onClose, onSave, onToast }) {
  const [form, setForm] = React.useState({ nombre: '', email: '', dni: '', telefono: '', disciplinas: [], password: '', passwordConfirm: '' });
  const [saving, setSaving] = React.useState(false);
  const [genLink, setGenLink] = React.useState(!!autoLink);
  const [showPass, setShowPass] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDisc = (d) => setForm(f => ({
    ...f,
    disciplinas: f.disciplinas.includes(d) ? f.disciplinas.filter(x => x !== d) : [...f.disciplinas, d],
  }));

  const disciplinasOpciones = ['Fútbol','Básquet','Natación','Tenis','Atletismo','Artes Marciales','Yoga','Pilates','Vóley'];

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.email.trim()) { onToast('Nombre y email son obligatorios'); return; }
    if (form.password && form.password.length < 6) { onToast('La contraseña debe tener al menos 6 caracteres'); return; }
    if (form.password && form.password !== form.passwordConfirm) { onToast('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      const nuevo = await api.createProfessor({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        dni: form.dni || null,
        telefono: form.telefono || null,
        disciplinas: form.disciplinas,
        password: form.password || null,
      });
      onSave(nuevo, genLink && !form.password);
    } catch (e) { onToast('Error: ' + e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {autoLink ? <Icon.mail size={18}/> : <Icon.plus size={18}/>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {autoLink ? 'Invitar por enlace' : 'Nuevo profesor'}
            </div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>
              {autoLink ? 'Invitar profesor' : 'Agregar profesor'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo</div>
              <input className="input" placeholder="Carlos Méndez" autoFocus value={form.nombre} onChange={e => set('nombre', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
              <input className="input" type="email" placeholder="carlos@club.com" value={form.email} onChange={e => set('email', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>DNI (opcional)</div>
              <input className="input tnum" placeholder="00.000.000" value={form.dni} onChange={e => set('dni', e.target.value)}/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Teléfono (opcional)</div>
              <input className="input" placeholder="+54 11 0000-0000" value={form.telefono} onChange={e => set('telefono', e.target.value)}/>
            </label>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Contraseña de acceso</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Contraseña</div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="mín. 6 caracteres"
                    value={form.password} onChange={e => set('password', e.target.value)}/>
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}>
                    <Icon.eye size={14}/>
                  </button>
                </div>
              </label>
              <label>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>Confirmar contraseña</div>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="repetir contraseña"
                  value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)}/>
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              Si dejas vacío, el profesor accede por enlace mágico y crea su contraseña en el primer ingreso.
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Disciplinas</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {disciplinasOpciones.map(d => (
                <button key={d} className="tweaks-chip" aria-pressed={form.disciplinas.includes(d)} onClick={() => toggleDisc(d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          {!autoLink && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
              <input type="checkbox" checked={genLink} onChange={e => setGenLink(e.target.checked)} style={{ width: 16, height: 16 }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Generar enlace de acceso automáticamente</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Se generará un link de un solo uso para que el profesor acceda a su panel</div>
              </div>
            </label>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : autoLink ? 'Crear e invitar' : 'Agregar profesor'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkModal({ data, onClose, onCopy, onRegenerate }) {
  const [dias, setDias] = React.useState(data.dias || 7);
  const [permanent, setPermanent] = React.useState(!!data.permanent);
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  React.useEffect(() => { setDias(data.dias || 7); setPermanent(!!data.permanent); setEmailSent(false); setEmailError(''); }, [data.token]);

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailError('');
    try {
      await api.sendMagicLinkEmail(data.profesor.id);
      setEmailSent(true);
    } catch (e) {
      setEmailError(e.message || 'Error enviando email');
    } finally {
      setSendingEmail(false);
    }
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(16, 24, 40, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2500, padding: 20, animation: 'fadeIn 0.2s ease-out',
    }} onClick={onClose}>
      <div className="card anim-slide-up" onClick={e => e.stopPropagation()} style={{
        width: 520, maxWidth: '100%', padding: 0, overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--accent-soft)', color: 'var(--accent-ink)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.link size={18}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enlace generado
            </div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em' }}>
              Acceso para {data.profesor.nombre}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}>
            <Icon.x size={18}/>
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>URL de un solo uso</div>
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
            padding: 10, background: 'var(--ink)', color: 'var(--bg)',
            borderRadius: 10,
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.01em',
            wordBreak: 'break-all',
          }}>
            <div style={{ flex: 1 }}>{data.url}</div>
            <button onClick={onCopy} className="btn btn-sm" style={{
              background: data.copied ? 'var(--present)' : 'var(--accent)',
              color: data.copied ? '#fff' : 'var(--accent-ink)',
              border: 0, flexShrink: 0,
            }}>
              {data.copied ? <><Icon.check size={13}/> Copiado</> : <><Icon.link size={13}/> Copiar</>}
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            marginTop: 14,
          }}>
            <div style={{ padding: 12, background: permanent ? 'var(--present-soft)' : 'var(--surface-2)', borderRadius: 10, border: `1px solid ${permanent ? 'color-mix(in oklab, var(--present) 30%, transparent)' : 'var(--line)'}` }}>
              <div style={{ fontSize: 10, color: permanent ? 'var(--present)' : 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vigencia</div>
              <div className="display" style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: permanent ? 'var(--present)' : 'inherit' }}>
                {permanent ? '∞ Sin vencimiento' : formatDateES(data.expira)}
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{maskToken(data.token)}</div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginTop: 16, marginBottom: 8 }}>Regenerar con vigencia</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 7, 15, 30].map(d => (
              <button key={d} onClick={() => { setPermanent(false); setDias(d); onRegenerate({ dias: d, permanent: false }); }}
                className="tweaks-chip" aria-pressed={!permanent && dias === d} style={{ flex: '1 0 20%' }}>
                {d} {d === 1 ? 'día' : 'días'}
              </button>
            ))}
            <button onClick={() => { setPermanent(true); onRegenerate({ permanent: true }); }}
              className="tweaks-chip" aria-pressed={permanent}
              style={{ flex: '1 0 100%', color: permanent ? 'var(--present)' : undefined, borderColor: permanent ? 'var(--present)' : undefined }}>
              ∞ Permanente (sin vencimiento)
            </button>
          </div>

          <div style={{
            marginTop: 14, padding: 12, borderRadius: 10,
            background: 'var(--late-soft)',
            border: '1px solid color-mix(in oklab, var(--late) 25%, transparent)',
            fontSize: 12, color: 'var(--accent-ink)', lineHeight: 1.5,
          }}>
            <b>Seguridad:</b> el enlace permite acceso sin contraseña al panel del profesor. {permanent ? 'Los tokens permanentes no expiran — solo se invalidan revocándolos manualmente.' : 'Se invalida al expirar o al revocarse manualmente.'}
          </div>

          {emailError && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--absent-soft)', color: 'var(--absent)', fontSize: 12 }}>
              {emailError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" onClick={onCopy} style={{ flex: 1 }}>
              {data.copied ? <><Icon.check size={15}/> Copiado</> : <><Icon.link size={15}/> Copiar enlace</>}
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || emailSent} style={{ flex: 1 }}>
              {emailSent ? <><Icon.check size={15}/> Enviado</> : sendingEmail ? 'Enviando…' : <><Icon.mail size={15}/> Enviar por correo</>}
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose} style={{ width: '100%', marginTop: 8 }}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: REPORTES
// ═══════════════════════════════════════════════════════════════
function AdminReportes() {
  const [range, setRange] = React.useState('12m');
  const [exportModal, setExportModal] = React.useState(false);
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const labels = range === '6m' ? meses.slice(-6) : meses;
  const inscVals = range === '6m' ? REPORTES.inscripcionesMes.slice(-6) : REPORTES.inscripcionesMes;
  const ingVals = range === '6m' ? REPORTES.ingresosMes.slice(-6) : REPORTES.ingresosMes;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Reportes</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Segmented value={range} onChange={setRange} options={[{value:'6m',label:'6 meses'},{value:'12m',label:'12 meses'}]}/>
          <Button variant="secondary" size="sm" onClick={() => setExportModal(true)}>
            <Icon.filter size={14}/> Exportar CSV
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: 14, marginBottom: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="eyebrow">Inscripciones</div>
              <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{inscVals.reduce((a,b)=>a+b,0)}</div>
            </div>
            <span className="pill pill-present">↑ 12%</span>
          </div>
          <BarChart values={inscVals} labels={labels} height={160}/>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="eyebrow">Ingresos (miles ARS)</div>
              <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>$ {ingVals.reduce((a,b)=>a+b,0).toLocaleString('es-AR')}k</div>
            </div>
            <span className="pill pill-present">↑ 8%</span>
          </div>
          <BarChart values={ingVals} labels={labels} height={160} accent="var(--ink)"/>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Asistencia por disciplina</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REPORTES.asistenciaPorDisciplina.map(d => (
            <div key={d.nombre} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px 60px', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.nombre}</div>
              <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div style={{
                  height: '100%', width: `${d.pct}%`,
                  background: d.pct >= 80 ? 'var(--present)' : d.pct >= 60 ? 'var(--late)' : d.pct > 0 ? 'var(--absent)' : 'transparent',
                  transition: 'width 0.6s ease',
                }}/>
              </div>
              <div className="tnum" style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{d.pct}%</div>
              <div className="tnum" style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'right' }}>{d.alumnos} alu.</div>
            </div>
          ))}
        </div>
      </div>

      {exportModal && <ExportModal onClose={() => setExportModal(false)}/>}
    </div>
  );
}

function ExportModal({ onClose }) {
  const [tipo, setTipo] = React.useState('pagos');
  const [desde, setDesde] = React.useState(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().slice(0,10));
  const [hasta, setHasta] = React.useState(new Date().toISOString().slice(0,10));
  const [exporting, setExporting] = React.useState(false);

  const csvDownload = (filename, rows) => {
    const content = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (tipo === 'pagos') {
        const data = await api.getPayments();
        const pagos = (data.pagos || []).filter(p => {
          const f = p.fecha?.slice(0,10);
          return (!desde || f >= desde) && (!hasta || f <= hasta);
        });
        const rows = [['ID','Socio','Concepto','Tipo','Monto','Estado','Método','Comprobante','Período','Comentario','Fecha']];
        pagos.forEach(p => rows.push([p.id, p.socio||'', p.concepto||'', p.tipo||'mensualidad', p.monto, p.estado, p.metodo||'', p.comprobante||'', p.periodo||'', p.comentario||'', p.fecha||'']));
        csvDownload(`pagos_${desde}_${hasta}.csv`, rows);
      } else if (tipo === 'socios') {
        const data = await api.getInscriptions({ estado: 'confirmada' });
        const list = Array.isArray(data) ? data : (data.inscripciones || []);
        const rows = [['ID','Nombre','Estado','Taller','Fecha inscripción']];
        list.forEach(i => rows.push([i.id, i.socio||i.socio_nombre||'', i.estado||'', i.taller||i.taller_nombre||'', i.fecha||'']));
        csvDownload(`socios_${new Date().toISOString().slice(0,10)}.csv`, rows);
      } else if (tipo === 'talleres') {
        const data = await api.adminGetWorkshops();
        const rows = [['ID','Nombre','Horario','Capacidad','Inscriptos','Precio']];
        (data || []).forEach(t => rows.push([t.id, t.nombre||'', t.horario||'', t.capacidad||'', t.inscriptos||'', t.precio||'']));
        csvDownload(`talleres_${new Date().toISOString().slice(0,10)}.csv`, rows);
      } else if (tipo === 'profesores') {
        const data = await api.getProfessors();
        const rows = [['ID','Nombre','Email','Teléfono','Estado','Desde']];
        (data || []).forEach(p => rows.push([p.id, p.nombre||'', p.email||'', p.telefono||'', p.activo ? 'activo' : 'inactivo', p.creado||'']));
        csvDownload(`profesores_${new Date().toISOString().slice(0,10)}.csv`, rows);
      }
    } catch (e) {
      alert('Error al exportar: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const TIPOS_EXPORT = [
    { id: 'pagos',      icon: '💰', label: 'Pagos y movimientos' },
    { id: 'socios',     icon: '👥', label: 'Socios inscriptos' },
    { id: 'talleres',   icon: '🏫', label: 'Talleres' },
    { id: 'profesores', icon: '👨‍🏫', label: 'Profesores' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.filter size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Exportación avanzada</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Exportar datos CSV</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>¿Qué deseas exportar?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TIPOS_EXPORT.map(t => (
                <button key={t.id} onClick={() => setTipo(t.id)} style={{
                  padding: '12px 10px', borderRadius: 8, border: `1px solid ${tipo === t.id ? 'var(--accent)' : 'var(--line)'}`,
                  background: tipo === t.id ? 'var(--accent-soft)' : 'var(--surface-2)',
                  color: tipo === t.id ? 'var(--accent-ink)' : 'var(--ink-2)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12,
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {tipo === 'pagos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Desde</div>
                <input className="input tnum" type="date" value={desde} onChange={e => setDesde(e.target.value)}/>
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Hasta</div>
                <input className="input tnum" type="date" value={hasta} onChange={e => setHasta(e.target.value)}/>
              </label>
            </div>
          )}

          <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Se descargará un archivo <code style={{ fontFamily: 'var(--font-mono)' }}>.csv</code> compatible con Excel y Google Sheets. Incluye todos los campos disponibles del módulo seleccionado.
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleExport} disabled={exporting} style={{ flex: 1 }}>
              {exporting ? 'Exportando…' : '⬇ Descargar CSV'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO: EMPRESA
// ═══════════════════════════════════════════════════════════════
function AdminEmpresa({ setTweaks, onToast }) {
  const [emp, setEmp] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [editModal, setEditModal] = React.useState(false);

  const load = () => {
    setLoading(true);
    api.getCompany().then(data => { setEmp(data); }).catch(() => {}).finally(() => setLoading(false));
  };
  React.useEffect(load, []);

  const handleSave = async (form) => {
    try {
      await api.updateCompany(form);
      setEmp(prev => ({ ...prev, ...form }));
      setEditModal(false);
      onToast('Datos guardados');
      if (form.color_marca && setTweaks) setTweaks(t => ({ ...t, palette: form.color_marca }));
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const logo = ev.target.result;
      try {
        await api.updateCompany({ logo });
        setEmp(prev => ({ ...prev, logo }));
        onToast('Logo actualizado');
      } catch (ex) { onToast('Error guardando logo'); }
    };
    reader.readAsDataURL(file);
  };

  const PALETAS = [
    { id: 'lima',    color: 'oklch(82% 0.19 125)', label: 'Lima' },
    { id: 'coral',   color: 'oklch(72% 0.18 30)',  label: 'Coral' },
    { id: 'azul',    color: 'oklch(65% 0.18 245)', label: 'Azul' },
    { id: 'violeta', color: 'oklch(62% 0.20 300)', label: 'Violeta' },
  ];

  const handleColorChange = async (palette) => {
    try {
      await api.updateCompany({ color_marca: palette });
      setEmp(prev => ({ ...prev, color_marca: palette }));
      if (setTweaks) setTweaks(t => ({ ...t, palette }));
      onToast('Color de marca actualizado');
    } catch (e) { onToast('Error: ' + e.message); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>;

  const e = emp || {};
  const sedes = e.sedes || [];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Empresa</h1>
        </div>
        <Button size="sm" onClick={() => setEditModal(true)}><Icon.edit size={14}/> Editar datos</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Datos institución */}
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Datos de la institución</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            {e.logo ? (
              <img src={e.logo} alt="Logo" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'contain', background: 'var(--surface-2)', border: '1px solid var(--line)', padding: 4 }}/>
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--ink)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>
                {(e.nombre || 'CP').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>{e.nombre || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{e.razon || ''}</div>
            </div>
          </div>
          {[
            { l: 'CUIT', v: e.cuit },
            { l: 'Dirección', v: e.direccion },
            { l: 'Teléfono', v: e.telefono },
            { l: 'Correo', v: e.email },
            { l: 'Sitio web', v: e.web },
            { l: 'Horario', v: e.horario },
          ].map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 0 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.l}</div>
              <div style={{ fontSize: 13.5, color: f.v ? 'var(--ink)' : 'var(--ink-3)', fontStyle: f.v ? 'normal' : 'italic' }}>{f.v || 'Sin datos'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sedes */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="eyebrow">Sedes</div>
            </div>
            {sedes.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>Sin sedes registradas.</div>}
            {sedes.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < sedes.length - 1 ? '1px solid var(--line)' : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.activa ? 'var(--accent-soft)' : 'var(--surface-2)', color: s.activa ? 'var(--accent-ink)' : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.map size={16}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.direccion || 'Sin dirección'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tnum" style={{ fontSize: 13, fontWeight: 700 }}>{s.canchas || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>canchas</div>
                </div>
                <span className={`pill pill-${s.activa ? 'present' : 'muted'}`}>{s.activa ? 'activa' : 'cerrada'}</span>
              </div>
            ))}
          </div>

          {/* Personalización */}
          <div className="card" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Personalización</div>
            {/* Logo */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Logo del club</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {e.logo ? <img src={e.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/> : <Icon.map size={24} style={{ color: 'var(--ink-3)' }}/>}
                </div>
                <label style={{ cursor: 'pointer' }}>
                  <div className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon.edit size={13}/> {e.logo ? 'Cambiar logo' : 'Subir logo'}
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload}/>
                </label>
                {e.logo && <Button size="sm" variant="danger" onClick={async () => { await api.updateCompany({ logo: '' }); setEmp(p => ({ ...p, logo: null })); onToast('Logo eliminado'); }}>Eliminar</Button>}
              </div>
            </div>
            {/* Color de marca */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Color de marca</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PALETAS.map(p => (
                  <button key={p.id} onClick={() => handleColorChange(p.id)} title={p.label} style={{
                    width: 36, height: 36, borderRadius: 999, border: `3px solid ${(e.color_marca || 'lima') === p.id ? 'var(--ink)' : 'transparent'}`,
                    background: p.color, cursor: 'pointer', padding: 0,
                    boxShadow: (e.color_marca || 'lima') === p.id ? '0 0 0 1px var(--bg)' : 'none',
                    outline: 'none',
                  }}/>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                El cambio se aplica al instante en toda la interfaz.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {editModal && <EmpresaEditModal empresa={e} onClose={() => setEditModal(false)} onSave={handleSave} onToast={onToast}/>}
    </div>
  );
}

function EmpresaEditModal({ empresa, onClose, onSave, onToast }) {
  const [form, setForm] = React.useState({
    nombre: empresa.nombre || '', razon: empresa.razon || '', cuit: empresa.cuit || '',
    direccion: empresa.direccion || '', telefono: empresa.telefono || '',
    email: empresa.email || '', web: empresa.web || '', horario: empresa.horario || '',
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } catch (e) { onToast('Error: ' + e.message); setSaving(false); }
  };

  const fields = [
    { k: 'nombre', l: 'Nombre del club' },
    { k: 'razon', l: 'Razón social' },
    { k: 'cuit', l: 'CUIT' },
    { k: 'direccion', l: 'Dirección' },
    { k: 'telefono', l: 'Teléfono' },
    { k: 'email', l: 'Correo electrónico' },
    { k: 'web', l: 'Sitio web' },
    { k: 'horario', l: 'Horario de atención' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Configuración</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Editar datos de empresa</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => (
              <label key={f.k} style={{ gridColumn: ['direccion','horario','web'].includes(f.k) ? 'span 2' : undefined }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{f.l}</div>
                <input className="input" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.l}/>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN SHELL
// ═══════════════════════════════════════════════════════════════
function AdminShell({ onExitToProfesor, onToast, onLogout, setTweaks }) {
  const [module, setModule] = React.useState('dashboard');

  const items = [
    { id: 'dashboard',   label: 'Dashboard',    icon: <Icon.home size={18}/> },
    { id: 'socios',      label: 'Socios',       icon: <Icon.users size={18}/> },
    { id: 'talleres',    label: 'Talleres',     icon: <Icon.calendar size={18}/> },
    { id: 'profesores',  label: 'Profesores',   icon: <Icon.edit size={18}/> },
    { id: 'pagos',       label: 'Pagos',        icon: <Icon.trophy size={18}/> },
    { id: 'reportes',    label: 'Reportes',     icon: <Icon.history size={18}/> },
    { id: 'empresa',     label: 'Empresa',      icon: <Icon.map size={18}/> },
  ];

  const render = () => {
    switch (module) {
      case 'dashboard':   return <AdminDashboard onGoToProfesores={() => setModule('profesores')} onNuevaInscripcion={() => setModule('talleres')} onToast={onToast}/>;
      case 'socios':      return <AdminSocios onToast={onToast}/>;
      case 'talleres':    return <AdminTalleres onToast={onToast}/>;
      case 'profesores':  return <AdminProfesores onToast={onToast}/>;
      case 'pagos':       return <AdminPagos onToast={onToast}/>;
      case 'reportes':    return <AdminReportes/>;
      case 'empresa':     return <AdminEmpresa setTweaks={setTweaks} onToast={onToast}/>;
    }
  };

  return (
    <div className="desktop-shell" style={{ height: 820, maxWidth: 1400 }}>
      <div className="desktop-toolbar">
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="tl-dot" style={{ background: '#FF5F57' }}/>
          <span className="tl-dot" style={{ background: '#FEBC2E' }}/>
          <span className="tl-dot" style={{ background: '#28C840' }}/>
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
          clubpoli.com/admin
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100% - 40px)', background: 'var(--bg)' }}>
        {/* Sidebar admin */}
        <aside style={{
          width: 240, flexShrink: 0, borderRight: '1px solid var(--line)',
          background: 'var(--surface)', display: 'flex', flexDirection: 'column',
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
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Administración</div>
            </div>
          </div>

          <div className="eyebrow" style={{ padding: '0 8px 8px' }}>Módulos</div>
          {items.map(it => (
            <button key={it.id} onClick={() => setModule(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 0,
              background: module === it.id ? 'var(--ink)' : 'transparent',
              color: module === it.id ? 'var(--bg)' : 'var(--ink-2)',
              fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', marginBottom: 2,
            }}>
              {it.icon} <span style={{ flex: 1 }}>{it.label}</span>
              {it.id === 'profesores' && (
                <span className="pill pill-accent" style={{ height: 18, fontSize: 10, padding: '2px 7px' }}>
                  {Object.values(INITIAL_LINKS).filter(l => l.activo).length}
                </span>
              )}
            </button>
          ))}

          <div style={{ flex: 1 }}/>

          <button onClick={onExitToProfesor} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--line-2)',
            background: 'transparent', cursor: 'pointer', textAlign: 'left',
            fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)',
            marginBottom: 10,
          }}>
            <Icon.arrowRight size={14}/> Ver Panel Profesor
          </button>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 34, height: 34, background: 'oklch(82% 0.14 260)', fontSize: 13 }}>AD</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Dirección</div>
            </div>
            <button aria-label="Salir" onClick={onLogout} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 6 }}>
              <Icon.logout size={16}/>
            </button>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {render()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell });
