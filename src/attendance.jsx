// ──────────────────────────────────────────────────────────────
// Detalle de Taller + Toma de asistencia
// 3 variantes: 'checkbox' | 'swipe' | 'tri-state'
// ──────────────────────────────────────────────────────────────

function AttendanceRow({ p, state, onChange, variant, animatingId }) {
  const isAnim = animatingId === p.id && state === 'present';

  if (variant === 'tri-state') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 'calc(var(--density-y) - 2px) var(--density-x)',
        borderBottom: '1px solid var(--line)',
        background: state === 'present' ? 'var(--present-soft)' : 'transparent',
        transition: 'background 0.25s ease',
      }}>
        <Avatar name={p.nombre} bg={p.bg} initials={p.iniciales} size={38}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' }}>{p.nombre}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{p.edad} años</span>
            {p.estado === 'inactivo' && <span className="pill pill-muted" style={{ padding: '1px 6px', height: 16, fontSize: 10 }}>Inactivo</span>}
          </div>
        </div>
        <div className="row-status">
          <button aria-pressed={state === 'present'} data-val="present" onClick={() => onChange(p.id, 'present')} title="Presente">
            <Icon.check size={16}/>
          </button>
          <button aria-pressed={state === 'late'} data-val="late" onClick={() => onChange(p.id, 'late')} title="Tarde">
            <Icon.clock size={16}/>
          </button>
          <button aria-pressed={state === 'absent'} data-val="absent" onClick={() => onChange(p.id, 'absent')} title="Ausente">
            <Icon.x size={16}/>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'swipe') {
    // Swipe-style: fila con dos zonas, tap izquierda = ausente, tap derecha = presente
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(var(--density-y) - 4px) 10px',
        borderBottom: '1px solid var(--line)',
      }}>
        <Avatar name={p.nombre} bg={p.bg} initials={p.iniciales} size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>{p.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.edad} años</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onChange(p.id, state === 'absent' ? null : 'absent')}
            aria-label="Ausente"
            style={{
              width: 44, height: 44, borderRadius: 12,
              border: '1.5px solid ' + (state === 'absent' ? 'var(--absent)' : 'var(--line-2)'),
              background: state === 'absent' ? 'var(--absent)' : 'var(--surface)',
              color: state === 'absent' ? '#fff' : 'var(--ink-3)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
            <Icon.x size={18}/>
          </button>
          <button
            onClick={() => onChange(p.id, state === 'present' ? null : 'present')}
            aria-label="Presente"
            style={{
              width: 44, height: 44, borderRadius: 12,
              border: '1.5px solid ' + (state === 'present' ? 'var(--present)' : 'var(--line-2)'),
              background: state === 'present' ? 'var(--present)' : 'var(--surface)',
              color: state === 'present' ? '#fff' : 'var(--ink-3)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease',
              animation: isAnim ? 'pop 0.4s cubic-bezier(.34,1.56,.64,1)' : 'none',
            }}>
            <Icon.check size={18}/>
          </button>
        </div>
      </div>
    );
  }

  // Default: checkbox
  const toggle = () => onChange(p.id, state === 'present' ? null : 'present');
  return (
    <button onClick={toggle} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 'var(--density-y) var(--density-x)',
      borderBottom: '1px solid var(--line)',
      background: state === 'present' ? 'var(--present-soft)' : 'transparent',
      border: 0, borderBottom: '1px solid var(--line)',
      width: '100%', textAlign: 'left', cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      transition: 'background 0.25s ease',
    }}>
      <div
        className="check-circle"
        data-state={state === 'present' ? 'present' : ''}
        style={{ animation: isAnim ? 'pop 0.4s cubic-bezier(.34,1.56,.64,1)' : 'none' }}
      >
        {state === 'present' && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" style={{ strokeDasharray: 24, animation: 'checkDraw 0.3s ease-out forwards' }}/>
          </svg>
        )}
      </div>
      <Avatar name={p.nombre} bg={p.bg} initials={p.iniciales} size={40}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{p.nombre}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{p.edad} años</span>
          {p.estado === 'inactivo' && <span className="pill pill-muted" style={{ padding: '1px 6px', height: 16, fontSize: 10 }}>Inactivo</span>}
        </div>
      </div>
      {state === 'present' && <span className="pill pill-present">Presente</span>}
    </button>
  );
}

function WorkshopDetail({ workshop, variant, onBack, onShowHistory, onShowAdd, onToast }) {
  const participants = React.useMemo(() => getParticipants(workshop.id), [workshop.id]);
  const [activeTab, setActiveTab] = React.useState('asistencia');
  const [attendance, setAttendance] = React.useState(() => Object.fromEntries(participants.map(p => [p.id, null])));
  const [query, setQuery] = React.useState('');
  const [animatingId, setAnimatingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [pagosInfo, setPagosInfo] = React.useState(null);
  const today = todayISO();

  // Cargar asistencia existente de hoy al montar
  React.useEffect(() => {
    api.getAttendance(workshop.id, today).then(data => {
      if (data && data.attendance && Object.keys(data.attendance).length > 0) {
        setAttendance(prev => ({ ...prev, ...data.attendance }));
      }
    }).catch(() => {});
  }, [workshop.id, today]);

  React.useEffect(() => {
    if (activeTab === 'pagos' && !pagosInfo) {
      api.getWorkshopPayments(workshop.id).then(setPagosInfo).catch(() => setPagosInfo({ pagos: [], inscritos: [] }));
    }
  }, [activeTab]);

  const filtered = participants.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase())
  );

  const setState = (id, newState) => {
    setAttendance(prev => ({ ...prev, [id]: newState }));
    if (newState === 'present') {
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 400);
    }
  };

  const markAllPresent = () => {
    const next = {};
    participants.forEach(p => next[p.id] = 'present');
    setAttendance(next);
    onToast('Todos marcados como presentes');
  };

  const clearAll = () => {
    setAttendance(Object.fromEntries(participants.map(p => [p.id, null])));
    onToast('Asistencia limpiada');
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Solo enviar los que tienen estado marcado (no null)
      const toSave = Object.fromEntries(
        Object.entries(attendance).filter(([, v]) => v !== null)
      );
      const result = await api.saveAttendance(workshop.id, today, toSave);
      onToast(`Asistencia guardada · ${result.presentes}/${result.total} presentes`);
      // Actualizar historial cacheado
      delete ATTENDANCE_HISTORY[workshop.id];
    } catch (e) {
      onToast('Error al guardar: ' + (e.message || 'intente nuevamente'));
    } finally {
      setSaving(false);
    }
  };

  const stats = React.useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter(v => v === 'present').length,
      absent: values.filter(v => v === 'absent').length,
      late: values.filter(v => v === 'late').length,
      pending: values.filter(v => v == null).length,
    };
  }, [attendance]);

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

  const pagosPorAlumno = React.useMemo(() => {
    if (!pagosInfo) return {};
    const map = {};
    (pagosInfo.inscritos || []).forEach(p => { map[p.participante_id] = { ...p, mensualidades: {} }; });
    (pagosInfo.pagos || []).forEach(pg => {
      if (pg.periodo && map[pg.participante_id]) {
        map[pg.participante_id].mensualidades[pg.periodo] = pg;
      }
    });
    return map;
  }, [pagosInfo]);

  return (
    <>
      {/* Header */}
      <div className="sticky-head" style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {formatDateES(todayISO())} · {workshop.sede}
            </div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {workshop.emoji} {workshop.nombre}
            </div>
          </div>
          <IconButton onClick={onShowHistory} label="Historial"><Icon.history size={18}/></IconButton>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
          {[['asistencia','Asistencia'],['pagos','Pagos']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, border: 0, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
              background: activeTab === id ? 'var(--bg)' : 'transparent',
              color: activeTab === id ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {/* Stats + controles solo en tab asistencia */}
        {activeTab === 'asistencia' && (
          <>
            <div style={{ display: 'flex', gap: 8, padding: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', marginTop: 10 }}>
              <StatPill label="Presentes" value={stats.present} color="var(--present)" soft="var(--present-soft)"/>
              <StatPill label="Ausentes" value={stats.absent} color="var(--absent)" soft="var(--absent-soft)"/>
              {variant === 'tri-state' && <StatPill label="Tarde" value={stats.late} color="var(--late)" soft="var(--late-soft)"/>}
              <StatPill label="Sin marcar" value={stats.pending} color="var(--ink-2)" soft="var(--surface-2)"/>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Icon.search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
                <input className="input" placeholder="Buscar participante…" style={{ paddingLeft: 36, height: 40 }}
                  value={query} onChange={e => setQuery(e.target.value)}/>
              </div>
              <Button size="sm" variant="secondary" onClick={markAllPresent}>
                <Icon.check size={14}/> Todos
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Tab: Asistencia ── */}
      {activeTab === 'asistencia' && (
        <>
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin resultados para "{query}"</div>
            )}
            {filtered.map(p => (
              <AttendanceRow key={p.id} p={p} state={attendance[p.id]} onChange={setState} variant={variant} animatingId={animatingId}/>
            ))}
            <button onClick={onShowAdd} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', width: '100%', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--accent-ink)', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600 }}>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--accent-soft)', border: '1px dashed color-mix(in oklab, var(--accent) 40%, transparent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.plus size={16}/>
              </div>
              Agregar participante
            </button>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, background: 'color-mix(in oklab, var(--bg) 90%, transparent)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={clearAll} size="sm" style={{ height: 44 }}>
              <Icon.x size={14}/> Limpiar
            </Button>
            <Button onClick={saveAttendance} disabled={saving} style={{ flex: 1, height: 44 }}>
              {saving ? 'Guardando…' : 'Guardar asistencia'}
              {!saving && <span className="pill" style={{ background: 'color-mix(in oklab, var(--ink) 15%, transparent)', color: 'var(--accent-ink)', marginLeft: 4 }}>{stats.present + stats.absent + stats.late}/{participants.length}</span>}
            </Button>
          </div>
        </>
      )}

      {/* ── Tab: Pagos ── */}
      {activeTab === 'pagos' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {!pagosInfo ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando pagos…</div>
          ) : Object.keys(pagosPorAlumno).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Sin integrantes inscritos.</div>
          ) : (
            <>
              {/* Cabecera de meses */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 1 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Alumno</div>
                {meses.map(m => (
                  <div key={m.key} style={{ width: 36, textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)' }}>{m.label}</div>
                ))}
              </div>
              {Object.values(pagosPorAlumno).map((alumno, i, arr) => (
                <div key={alumno.participante_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 0 }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={alumno.nombre} bg={alumno.avatar_bg} initials={alumno.iniciales} size={32}/>
                    <span style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alumno.nombre}</span>
                  </div>
                  {meses.map(m => {
                    const pg = alumno.mensualidades[m.key];
                    const color = pg ? ({ pagado: 'var(--present)', pendiente: 'var(--late)', vencido: 'var(--absent)' }[pg.estado] || 'var(--ink-3)') : 'var(--line-2)';
                    const bg   = pg ? ({ pagado: 'var(--present-soft)', pendiente: 'var(--late-soft)', vencido: 'var(--absent-soft)' }[pg.estado] || 'var(--surface-2)') : 'var(--surface-2)';
                    return (
                      <div key={m.key} title={pg ? `${pg.concepto || 'Mensualidad'} · $${Number(pg.monto).toLocaleString('es-AR')} · ${pg.estado}` : 'Sin pago'} style={{
                        width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${color}`,
                        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {pg ? (
                          pg.estado === 'pagado'    ? <Icon.check size={14} style={{ color: 'var(--present)' }}/> :
                          pg.estado === 'vencido'   ? <Icon.x size={14} style={{ color: 'var(--absent)' }}/> :
                          <Icon.clock size={14} style={{ color: 'var(--late)' }}/>
                        ) : (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--line-2)', display: 'block' }}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {[['var(--present)','var(--present-soft)','Pagado'],['var(--late)','var(--late-soft)','Pendiente'],['var(--absent)','var(--absent-soft)','Vencido'],['var(--line-2)','var(--surface-2)','Sin registro']].map(([c, bg, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, border: `1.5px solid ${c}`, background: bg }}/>
                    <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function StatPill({ label, value, color, soft }) {
  return (
    <div style={{
      flex: 1, padding: '8px 6px', borderRadius: 10,
      background: soft,
      textAlign: 'center',
    }}>
      <div className="display tnum" style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

Object.assign(window, { WorkshopDetail, AttendanceRow });
