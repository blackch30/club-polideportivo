// ──────────────────────────────────────────────────────────────
// Historial, Agregar participante, Perfil
// ──────────────────────────────────────────────────────────────

function ProfPaymentsScreen({ workshops, onBack }) {
  const [pagosMap, setPagosMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [filtro, setFiltro] = React.useState('todos'); // 'todos' | 'pendientes'

  React.useEffect(() => {
    if (workshops.length === 0) { setLoading(false); return; }
    let done = 0;
    workshops.forEach(w => {
      api.getWorkshopPayments(w.id).then(data => {
        setPagosMap(prev => ({ ...prev, [w.id]: data }));
      }).catch(() => {
        setPagosMap(prev => ({ ...prev, [w.id]: { pagos: [], inscritos: [] } }));
      }).finally(() => {
        done++;
        if (done === workshops.length) setLoading(false);
      });
    });
  }, []);

  const meses = React.useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()],
      });
    }
    return result;
  }, []);

  const mesActual = meses[meses.length - 1].key;

  // Construir lista completa de alumnos con su estado mensual
  const alumnos = React.useMemo(() => {
    const result = [];
    workshops.forEach(w => {
      const data = pagosMap[w.id];
      if (!data) return;
      const mensualidadesPorAlumno = {};
      (data.pagos || []).forEach(pg => {
        if (!pg.periodo) return;
        if (!mensualidadesPorAlumno[pg.participante_id]) mensualidadesPorAlumno[pg.participante_id] = {};
        mensualidadesPorAlumno[pg.participante_id][pg.periodo] = pg;
      });
      (data.inscritos || []).forEach(p => {
        result.push({
          ...p,
          taller: w,
          mensualidades: mensualidadesPorAlumno[p.participante_id] || {},
        });
      });
    });
    return result;
  }, [pagosMap, workshops]);

  const filtrados = filtro === 'pendientes'
    ? alumnos.filter(a => !a.mensualidades[mesActual])
    : alumnos;

  const totalAlDia = alumnos.filter(a => a.mensualidades[mesActual]?.estado === 'pagado').length;
  const totalPendientes = alumnos.filter(a => !a.mensualidades[mesActual]).length;

  const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [anioActual, mesNum] = mesActual.split('-');
  const mesNombreActual = MESES_LABEL[Number(mesNum) - 1] + ' ' + anioActual;

  return (
    <>
      <div className="sticky-head" style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Módulo</div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>Pagos</div>
          </div>
        </div>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'pendientes', label: `Pendientes (${totalPendientes})` },
          ]}
        />
      </div>

      <div style={{ padding: '10px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Resumen del mes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card" style={{ padding: 14, textAlign: 'center', background: 'var(--present-soft)', border: '1px solid color-mix(in oklab, var(--present) 25%, transparent)' }}>
            <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--present)' }}>{loading ? '…' : totalAlDia}</div>
            <div style={{ fontSize: 10, color: 'var(--present)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Al día · {mesNombreActual}</div>
          </div>
          <div className="card" style={{ padding: 14, textAlign: 'center', background: 'var(--absent-soft)', border: '1px solid color-mix(in oklab, var(--absent) 25%, transparent)' }}>
            <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--absent)' }}>{loading ? '…' : totalPendientes}</div>
            <div style={{ fontSize: 10, color: 'var(--absent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Sin pagar · {mesNombreActual}</div>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando pagos…</div>
        )}

        {!loading && filtrados.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {filtro === 'pendientes' ? '✓ Todos al día este mes' : 'Sin alumnos inscritos.'}
          </div>
        )}

        {/* Lista agrupada por taller */}
        {!loading && workshops.map(w => {
          const grupo = filtrados.filter(a => a.taller.id === w.id);
          if (grupo.length === 0) return null;
          // Totales por mes para este taller (sobre TODOS los alumnos, no solo filtrados)
          const grupoTotal = alumnos.filter(a => a.taller.id === w.id);
          const totMes = meses.map(m => ({
            pagados:  grupoTotal.filter(a => a.mensualidades[m.key]?.estado === 'pagado').length,
            pendientes: grupoTotal.filter(a => !a.mensualidades[m.key]).length,
            monto: grupoTotal.reduce((s, a) => s + (a.mensualidades[m.key]?.estado === 'pagado' ? Number(a.mensualidades[m.key].monto) : 0), 0),
          }));
          const totalRecaudado = totMes.reduce((s, t) => s + t.monto, 0);
          return (
            <div key={w.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cabecera taller */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: w.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{w.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>{w.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{grupoTotal.length} alumno{grupoTotal.length !== 1 ? 's' : ''}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--present)' }} className="tnum">
                  {grupoTotal.filter(a => a.mensualidades[mesActual]?.estado === 'pagado').length} ✓
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--absent)' }} className="tnum">
                  {grupoTotal.filter(a => !a.mensualidades[mesActual]).length} ✗
                </span>
              </div>

              {/* Filas de alumnos */}
              {grupo.map((alumno, i) => {
                const pgActual = alumno.mensualidades[mesActual];
                const estadoColor = pgActual
                  ? ({ pagado: 'var(--present)', pendiente: 'var(--late)', vencido: 'var(--absent)' }[pgActual.estado] || 'var(--ink-3)')
                  : 'var(--absent)';
                const estadoLabel = pgActual ? pgActual.estado : 'sin pago';
                return (
                  <div key={alumno.participante_id + '-' + w.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    borderBottom: '1px solid var(--line)',
                    background: !pgActual ? 'color-mix(in oklab, var(--absent) 4%, transparent)' : 'transparent',
                  }}>
                    <Avatar name={alumno.nombre} bg={alumno.avatar_bg} initials={alumno.iniciales} size={34}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alumno.nombre}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {meses.map(m => {
                          const pg = alumno.mensualidades[m.key];
                          const c  = pg ? ({ pagado: 'var(--present)', pendiente: 'var(--late)', vencido: 'var(--absent)' }[pg.estado] || 'var(--ink-3)') : 'var(--line-2)';
                          const bg = pg ? ({ pagado: 'var(--present-soft)', pendiente: 'var(--late-soft)', vencido: 'var(--absent-soft)' }[pg.estado] || 'var(--surface-2)') : 'var(--surface-2)';
                          return (
                            <div key={m.key} title={pg ? `${m.label}: ${pg.estado} · $${Number(pg.monto).toLocaleString('es-AR')}` : `${m.label}: sin pago`}
                              style={{ padding: '2px 7px', borderRadius: 6, border: `1px solid ${c}`, background: bg, fontSize: 10, fontWeight: 700, color: c, letterSpacing: '0.02em' }}>
                              {m.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {pgActual && <div className="tnum" style={{ fontSize: 13, fontWeight: 700 }}>$ {Number(pgActual.monto).toLocaleString('es-AR')}</div>}
                      <div style={{ fontSize: 11, fontWeight: 600, color: estadoColor, marginTop: pgActual ? 1 : 0 }}>{estadoLabel}</div>
                    </div>
                  </div>
                );
              })}

              {/* ── Totales del taller ── */}
              <div style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--ink) 4%, var(--surface-2))', borderTop: '2px solid var(--line)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>
                  Totales por mes
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {meses.map((m, i) => (
                    <div key={m.key} style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      background: m.key === mesActual ? 'var(--accent-soft)' : 'var(--surface-2)',
                      border: `1px solid ${m.key === mesActual ? 'var(--accent)' : 'var(--line)'}`,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: m.key === mesActual ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700 }}>
                        <span style={{ color: 'var(--present)' }}>{totMes[i].pagados}✓</span>
                        {totMes[i].pendientes > 0 && <span style={{ color: 'var(--absent)', marginLeft: 4 }}>{totMes[i].pendientes}✗</span>}
                      </div>
                      {totMes[i].monto > 0 && (
                        <div className="tnum" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                          $ {totMes[i].monto.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Celda total acumulado */}
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '2px solid var(--line)', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                    <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--present)', marginTop: 4 }}>
                      {totMes.reduce((s, t) => s + t.pagados, 0)}✓
                    </div>
                    {totalRecaudado > 0 && (
                      <div className="tnum" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                        $ {totalRecaudado.toLocaleString('es-AR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Resumen global al pie ── */}
        {!loading && alumnos.length > 0 && (
          <div className="card" style={{ padding: 14, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>
              Resumen global
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {meses.map(m => {
                const pagados   = alumnos.filter(a => a.mensualidades[m.key]?.estado === 'pagado').length;
                const pendientes = alumnos.filter(a => !a.mensualidades[m.key]).length;
                const monto     = alumnos.reduce((s, a) => s + (a.mensualidades[m.key]?.estado === 'pagado' ? Number(a.mensualidades[m.key].monto) : 0), 0);
                const total     = pagados + pendientes;
                const pct       = total > 0 ? Math.round((pagados / total) * 100) : 0;
                return (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, fontSize: 11, fontWeight: 700, color: m.key === mesActual ? 'var(--accent)' : 'var(--ink-2)' }}>{m.label}</div>
                    <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--present)' : pct >= 50 ? 'var(--late)' : 'var(--absent)', borderRadius: 999, transition: 'width 0.5s ease' }}/>
                    </div>
                    <div className="tnum" style={{ fontSize: 11, fontWeight: 700, minWidth: 32, textAlign: 'right', color: pct >= 80 ? 'var(--present)' : pct >= 50 ? 'var(--late)' : 'var(--absent)' }}>{pct}%</div>
                    <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 70, textAlign: 'right' }}>
                      {monto > 0 ? `$ ${monto.toLocaleString('es-AR')}` : '—'}
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {alumnos.length} alumnos en {workshops.filter(w => alumnos.some(a => a.taller.id === w.id)).length} talleres
                </span>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--present)' }}>
                  $ {alumnos.reduce((s, a) => {
                    return s + meses.reduce((ms, m) => ms + (a.mensualidades[m.key]?.estado === 'pagado' ? Number(a.mensualidades[m.key].monto) : 0), 0);
                  }, 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function GlobalHistoryScreen({ workshops, onSelectWorkshop, onBack }) {
  const [histMap, setHistMap] = React.useState({});

  React.useEffect(() => {
    workshops.forEach(w => {
      api.getAttendanceHistory(w.id).then(h => {
        setHistMap(prev => ({ ...prev, [w.id]: h }));
      }).catch(() => {});
    });
  }, []);

  const totalClases = Object.values(histMap).reduce((a, h) => a + h.length, 0);
  const pctGlobal = (() => {
    let presTotal = 0, tot = 0;
    Object.values(histMap).forEach(h => h.forEach(c => { presTotal += c.presentes; tot += c.total; }));
    return tot > 0 ? Math.round((presTotal / tot) * 100) : null;
  })();

  return (
    <>
      <div className="sticky-head" style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>General</div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>Historial de asistencia</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Resumen global */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{totalClases}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Clases registradas</div>
          </div>
          <div className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: pctGlobal !== null ? (pctGlobal >= 80 ? 'var(--present)' : pctGlobal >= 60 ? 'var(--late)' : 'var(--absent)') : 'var(--ink-3)' }}>
              {pctGlobal !== null ? pctGlobal + '%' : '…'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Asistencia promedio</div>
          </div>
        </div>

        {/* Un card por taller */}
        {workshops.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Sin talleres asignados.
          </div>
        )}
        {workshops.map(w => {
          const h = histMap[w.id];
          const cargando = h === undefined;
          const clases = h ? h.length : 0;
          const pct = h && h.length > 0 ? (() => {
            let p = 0, t = 0;
            h.forEach(c => { p += c.presentes; t += c.total; });
            return t > 0 ? Math.round((p / t) * 100) : 0;
          })() : null;

          return (
            <button key={w.id} onClick={() => onSelectWorkshop(w)} style={{
              background: 'transparent', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', width: '100%',
            }}>
              <div className="card" style={{ padding: 16 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: clases > 0 ? 12 : 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: w.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{w.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{w.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                      {cargando ? 'Cargando…' : clases === 0 ? 'Sin clases registradas' : `${clases} clase${clases !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {pct !== null && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: pct >= 80 ? 'var(--present)' : pct >= 60 ? 'var(--late)' : 'var(--absent)' }}>{pct}%</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>asistencia</div>
                    </div>
                  )}
                  <Icon.chevronRight size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }}/>
                </div>

                {/* Últimas 5 clases */}
                {h && h.length > 0 && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {h.slice(0, 5).map((c, i) => {
                      const p = c.total > 0 ? (c.presentes / c.total) * 100 : 0;
                      return (
                        <div key={i} title={`${c.fecha}: ${c.presentes}/${c.total}`} style={{
                          flex: 1, height: 28, borderRadius: 6, overflow: 'hidden',
                          background: 'var(--surface-2)', border: '1px solid var(--line)',
                          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        }}>
                          <div style={{ width: '100%', height: `${p}%`, background: p >= 80 ? 'var(--present)' : p >= 60 ? 'var(--late)' : 'var(--absent)', transition: 'height 0.4s ease' }}/>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function HistoryScreen({ workshop, onBack }) {
  const [activeTab, setActiveTab] = React.useState('fecha');
  const [history, setHistory] = React.useState(ATTENDANCE_HISTORY[workshop.id] || []);
  const [loadingFecha, setLoadingFecha] = React.useState(!ATTENDANCE_HISTORY[workshop.id]);
  const [partHistory, setPartHistory] = React.useState(null);
  const [loadingPart, setLoadingPart] = React.useState(false);
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    if (ATTENDANCE_HISTORY[workshop.id]) {
      setHistory(ATTENDANCE_HISTORY[workshop.id]);
      setLoadingFecha(false);
      return;
    }
    setLoadingFecha(true);
    api.getAttendanceHistory(workshop.id).then(data => {
      ATTENDANCE_HISTORY[workshop.id] = data;
      setHistory(data);
    }).catch(() => {}).finally(() => setLoadingFecha(false));
  }, [workshop.id]);

  React.useEffect(() => {
    if (activeTab === 'alumno' && !partHistory && !loadingPart) {
      setLoadingPart(true);
      api.getParticipantAttendance(workshop.id)
        .then(setPartHistory)
        .catch(() => setPartHistory([]))
        .finally(() => setLoadingPart(false));
    }
  }, [activeTab]);

  const values = history.map(h => h.presentes);
  const totalPresentes = history.reduce((a, h) => a + h.presentes, 0);
  const totalAlumnos   = history.reduce((a, h) => a + h.total, 0);
  const sortedParts = partHistory ? [...partHistory].sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1)) : [];

  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  return (
    <>
      <div className="sticky-head" style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Historial</div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>{workshop.nombre}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
          {[['fecha','Por fecha'],['alumno','Por alumno']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, padding: '7px 0', borderRadius: 7, border: 0, cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
              background: activeTab === id ? 'var(--bg)' : 'transparent',
              color: activeTab === id ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Tab: Por fecha ── */}
      {activeTab === 'fecha' && (
        <div style={{ padding: '8px 20px 24px' }}>
          {loadingFecha ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>
          ) : (
            <>
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                  <div>
                    <div className="eyebrow">Últimas clases</div>
                    <div className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      <span className="tnum">{totalAlumnos > 0 ? Math.round((totalPresentes / totalAlumnos) * 100) : 0}</span>
                      <span style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>%</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>asistencia promedio</div>
                  </div>
                  {values.length > 0 && <Sparkline values={values.slice().reverse()}/>}
                </div>
              </div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Registro</div>
              {history.length === 0 && (
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  Aún no hay asistencias registradas para este taller.
                </div>
              )}
              {history.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {history.map((h, i) => {
                    const pct = h.total > 0 ? (h.presentes / h.total) * 100 : 0;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < history.length - 1 ? '1px solid var(--line)' : 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div className="display tnum" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{new Date(h.fecha + 'T12:00:00').getDate()}</div>
                          <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em' }}>{MESES[new Date(h.fecha + 'T12:00:00').getMonth()]}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>{formatDateES(h.fecha)}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                            <span style={{ color: 'var(--present)', fontWeight: 600 }} className="tnum">{h.presentes} presentes</span>
                            {' · '}
                            <span className="tnum">{h.ausentes} ausentes</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="display tnum" style={{ fontSize: 15, fontWeight: 700 }}>{Math.round(pct)}%</div>
                          <div style={{ width: 44, height: 4, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--present)' : pct >= 60 ? 'var(--late)' : 'var(--absent)' }}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Por alumno ── */}
      {activeTab === 'alumno' && (
        <div style={{ padding: '8px 20px 24px' }}>
          {loadingPart ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>
          ) : sortedParts.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin integrantes registrados.</div>
          ) : (
            <>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {sortedParts.map((p, i) => {
                  const pct = p.pct ?? 0;
                  const isExp = expanded[p.id];
                  return (
                    <div key={p.id} style={{ borderBottom: i < sortedParts.length - 1 ? '1px solid var(--line)' : 0 }}>
                      <button onClick={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 14px', width: '100%', background: 'transparent',
                        border: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                      }}>
                        <Avatar name={p.nombre} bg={p.avatar_bg} initials={p.iniciales} size={40}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em' }}>{p.nombre}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                            <div style={{ flex: 1, height: 5, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--present)' : pct >= 60 ? 'var(--late)' : 'var(--absent)', borderRadius: 999, transition: 'width 0.4s ease' }}/>
                            </div>
                            <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? 'var(--present)' : pct >= 60 ? 'var(--late)' : 'var(--absent)', minWidth: 34 }}>{p.pct !== null ? pct + '%' : '—'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 4 }}>
                          <div className="tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{p.presentes}/{p.total}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>presencias</div>
                        </div>
                        <Icon.chevronRight size={14} style={{ color: 'var(--ink-3)', transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}/>
                      </button>
                      {isExp && p.fechas.length > 0 && (
                        <div style={{ padding: '0 14px 12px 66px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.fechas.map((f, j) => {
                            const d = new Date(f.fecha + 'T12:00:00');
                            const presente = f.estado === 'present' || f.estado === 'late';
                            return (
                              <div key={j} title={`${f.fecha}: ${f.estado}`} style={{
                                padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                background: presente ? 'var(--present-soft)' : 'var(--absent-soft)',
                                color: presente ? 'var(--present)' : 'var(--absent)',
                                border: `1px solid ${presente ? 'color-mix(in oklab, var(--present) 25%, transparent)' : 'color-mix(in oklab, var(--absent) 25%, transparent)'}`,
                              }}>
                                {d.getDate()} {MESES[d.getMonth()]}
                              </div>
                            );
                          })}
                          {p.fechas.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Sin registros</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function AddParticipantScreen({ workshop, onBack, onToast }) {
  const [tab, setTab] = React.useState('search'); // 'search' | 'new'
  const [q, setQ] = React.useState('');
  const [form, setForm] = React.useState({ nombre: '', edad: '', contacto: '' });
  const [available, setAvailable] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (tab !== 'search') return;
    api.getAvailableParticipants(workshop.id).then(setAvailable).catch(() => {});
  }, [workshop.id, tab]);

  const results = q
    ? available.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase()))
    : available.slice(0, 6);

  const handleEnroll = async (p) => {
    setSaving(true);
    try {
      const result = await api.enrollParticipant(workshop.id, p.id);
      setAvailable(prev => prev.filter(x => x.id !== p.id));
      if (result?.estado === 'pendiente') {
        onToast(`Solicitud enviada — ${p.nombre.split(' ')[0]} pendiente de aprobación`);
      } else {
        onToast(`${p.nombre.split(' ')[0]} agregado al taller`);
      }
    } catch (e) {
      onToast('Error: ' + (e.message || 'intente nuevamente'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!form.nombre.trim()) { onToast('Ingrese el nombre'); return; }
    setSaving(true);
    try {
      const newPart = await api.createParticipant(form);
      const result = await api.enrollParticipant(workshop.id, newPart.id);
      PARTICIPANTS_POOL.push({
        id: newPart.id, nombre: newPart.nombre, edad: newPart.edad,
        estado: newPart.estado, iniciales: newPart.iniciales, bg: newPart.avatar_bg,
      });
      if (result?.estado === 'pendiente') {
        onToast('Participante registrado — solicitud de inscripción pendiente de aprobación');
      } else {
        onToast('Participante registrado y agregado al taller');
      }
      setTimeout(onBack, 500);
    } catch (e) {
      onToast('Error: ' + (e.message || 'intente nuevamente'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="sticky-head" style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{workshop.nombre}</div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>Agregar participante</div>
          </div>
        </div>
        <Segmented
          value={tab}
          onChange={(v) => { setTab(v); setQ(''); setForm({ nombre: '', edad: '', contacto: '' }); }}
          options={[
            { value: 'search', label: 'Buscar existente' },
            { value: 'new', label: 'Registrar nuevo' },
          ]}
        />
      </div>

      <div style={{ padding: '16px 20px 24px', flex: 1 }}>
        {tab === 'search' && (
          <>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Icon.search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
              <input className="input" placeholder="Nombre, DNI o correo" style={{ paddingLeft: 40 }}
                value={q} onChange={e => setQ(e.target.value)} autoFocus/>
            </div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{q ? 'Resultados' : 'Socios sin inscribir'}</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {results.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  {q ? `Sin coincidencias para "${q}"` : 'No hay socios disponibles'}
                </div>
              )}
              {results.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--line)' : 0,
                }}>
                  <Avatar name={p.nombre} bg={p.avatar_bg || p.bg} initials={p.iniciales} size={36}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.edad} años · Socio</div>
                  </div>
                  <Button size="sm" disabled={saving} onClick={() => handleEnroll(p)}>
                    <Icon.plus size={14}/> Agregar
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo</div>
              <input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Ana Ramírez"/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Edad</div>
              <input className="input" type="number" value={form.edad} onChange={e => setForm({ ...form, edad: e.target.value })} placeholder="14"/>
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Contacto del tutor</div>
              <input className="input" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="+54 11 5555-5555"/>
            </label>
            <div style={{
              padding: 12, borderRadius: 12, marginTop: 4,
              background: 'var(--late-soft)',
              border: '1px solid color-mix(in oklab, var(--late) 25%, transparent)',
              fontSize: 12, color: 'var(--accent-ink)',
            }}>
              Este registro queda pendiente de validación por administración.
            </div>
            <Button onClick={handleCreate} disabled={saving} style={{ marginTop: 4 }}>
              {saving ? 'Registrando…' : 'Registrar y agregar al taller'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function ProfileScreen({ onBack, onLogout }) {
  const [historialTalleres, setHistorialTalleres] = React.useState({});
  const totalAlumnos = WORKSHOPS.reduce((a, w) => a + (w.participantesIds?.length || 0), 0);

  React.useEffect(() => {
    WORKSHOPS.forEach(w => {
      api.getAttendanceHistory(w.id).then(h => {
        setHistorialTalleres(prev => ({ ...prev, [w.id]: h }));
      }).catch(() => {});
    });
  }, []);

  const calcPct = (wid) => {
    const h = historialTalleres[wid];
    if (!h || h.length === 0) return null;
    const total = h.reduce((a, c) => a + c.total, 0);
    const presentes = h.reduce((a, c) => a + c.presentes, 0);
    return total > 0 ? Math.round((presentes / total) * 100) : null;
  };

  const pctGlobal = (() => {
    const vals = WORKSHOPS.map(w => calcPct(w.id)).filter(v => v !== null);
    return vals.length ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length) : null;
  })();

  return (
    <>
      <div className="sticky-head" style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconButton onClick={onBack} label="Volver"><Icon.chevronLeft size={18}/></IconButton>
          <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>Mi perfil</div>
        </div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        {/* Avatar + info */}
        <div className="card" style={{ padding: 20, textAlign: 'center', marginBottom: 14 }}>
          <Avatar name={PROFESSOR.nombre} bg={PROFESSOR.avatarBg} initials={PROFESSOR.iniciales} size={72}/>
          <div className="display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 10 }}>{PROFESSOR.nombre}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{PROFESSOR.email}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
            <span className="pill pill-accent">Profesor</span>
            <span className="pill pill-muted">Desde {PROFESSOR.desde}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { l: 'Talleres', v: WORKSHOPS.length },
            { l: 'Alumnos', v: totalAlumnos },
            { l: 'Asist. %', v: pctGlobal !== null ? pctGlobal + '%' : '…' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: 12, textAlign: 'center' }}>
              <div className="display tnum" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Asistencia por taller */}
        {WORKSHOPS.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Asistencia por taller</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
              {WORKSHOPS.map((w, i) => {
                const pct = calcPct(w.id);
                const h = historialTalleres[w.id];
                return (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < WORKSHOPS.length - 1 ? '1px solid var(--line)' : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: w.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{w.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.nombre}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                        {h ? `${h.length} clases · ${w.participantesIds?.length || 0} alumnos` : 'Cargando…'}
                      </div>
                    </div>
                    {pct !== null ? (
                      <div style={{ textAlign: 'right' }}>
                        <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: pct>=80?'var(--present)':pct>=60?'var(--late)':'var(--absent)' }}>{pct}%</div>
                        <div style={{ width: 48, height: 4, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', marginTop: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct>=80?'var(--present)':pct>=60?'var(--late)':'var(--absent)', borderRadius: 999 }}/>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Cuenta */}
        <div className="eyebrow" style={{ marginBottom: 8 }}>Cuenta</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { icon: <Icon.user size={18}/>, label: 'Datos personales', meta: PROFESSOR.dni || '—' },
            { icon: <Icon.bell size={18}/>, label: 'Notificaciones', meta: 'Activas' },
            { icon: <Icon.lock size={18}/>, label: 'Seguridad', meta: '2FA' },
          ].map((it, i, arr) => (
            <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', width: '100%', background: 'transparent', border: 0, borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-ui)', color: 'var(--ink)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{it.icon}</div>
              <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{it.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{it.meta}</div>
              <Icon.chevronRight size={16} style={{ color: 'var(--ink-3)' }}/>
            </button>
          ))}
        </div>

        <button onClick={onLogout} className="btn btn-secondary" style={{ width: '100%', color: 'var(--absent)', borderColor: 'color-mix(in oklab, var(--absent) 30%, var(--line-2))' }}>
          <Icon.logout size={16}/> Cerrar sesión
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginTop: 18 }}>
          CLUB POLIDEPORTIVO · v2.4.1
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ProfPaymentsScreen, GlobalHistoryScreen, HistoryScreen, AddParticipantScreen, ProfileScreen });
