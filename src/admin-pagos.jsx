// ──────────────────────────────────────────────────────────────
// Módulo Pagos — vista unificada Movimientos + Mensualidades
// ──────────────────────────────────────────────────────────────

function AdminPagos({ onToast }) {
  // ── Estado mensualidades
  const [windowOffset, setWindowOffset] = React.useState(0);
  const [mensualData, setMensualData] = React.useState({});
  const [loadingMensual, setLoadingMensual] = React.useState(false);
  const [pagoModal, setPagoModal] = React.useState(null);
  const [filtroMensual, setFiltroMensual] = React.useState('todos');
  const [mensualOpen, setMensualOpen] = React.useState(true);

  // ── Estado movimientos
  const [pagos, setPagos] = React.useState(PAGOS_DATA || []);
  const [metodos, setMetodos] = React.useState([]);
  const [filter, setFilter] = React.useState('todos');
  const [tipoFilter, setTipoFilter] = React.useState('todos');
  const [selected, setSelected] = React.useState(null);
  const [regModal, setRegModal] = React.useState(false);

  const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Ventana de 6 meses
  const meses = React.useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + windowOffset - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ key, label: MESES_CORTOS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, [windowOffset]);

  const mesActualKey = meses[meses.length - 1]?.key;
  const mesesKey = meses.map(m => m.key).join(',');

  const rangeLabel = React.useMemo(() => {
    if (!meses.length) return '';
    const f = meses[0], l = meses[meses.length - 1];
    return f.year === l.year
      ? `${f.label} – ${l.label} ${l.year}`
      : `${f.label} ${f.year} – ${l.label} ${l.year}`;
  }, [meses]);

  React.useEffect(() => {
    if (!mensualOpen) return;
    setLoadingMensual(true);
    Promise.all(meses.map(m => api.getMonthlyPayments(m.key).catch(() => null)))
      .then(results => {
        const map = {};
        meses.forEach((m, i) => { if (results[i]) map[m.key] = results[i]; });
        setMensualData(map);
      })
      .finally(() => setLoadingMensual(false));
  }, [mesesKey, mensualOpen]);

  const talleresGrid = React.useMemo(() => {
    const tallerMap = {};
    meses.forEach(mes => {
      (mensualData[mes.key]?.talleres || []).forEach(t => {
        if (!tallerMap[t.id]) {
          tallerMap[t.id] = { id: t.id, nombre: t.nombre, emoji: t.emoji, color: t.color, horario: t.horario, alumnos: {} };
        }
        t.inscritos.forEach(a => {
          if (!tallerMap[t.id].alumnos[a.participante_id]) {
            tallerMap[t.id].alumnos[a.participante_id] = {
              participante_id: a.participante_id, nombre: a.nombre,
              iniciales: a.iniciales, avatar_bg: a.avatar_bg, pagos: {},
            };
          }
          tallerMap[t.id].alumnos[a.participante_id].pagos[mes.key] = a.pago || null;
        });
      });
    });
    return Object.values(tallerMap).map(t => ({
      ...t,
      alumnos: Object.values(t.alumnos).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }));
  }, [mensualData, mesesKey]);

  const globalStats = React.useMemo(() => {
    let pagados = 0, pendientes = 0, recaudado = 0;
    const alumnosUnicos = new Set();
    talleresGrid.forEach(t => {
      t.alumnos.forEach(a => {
        alumnosUnicos.add(a.participante_id);
        meses.forEach(mes => {
          const pg = a.pagos[mes.key];
          if (pg?.estado === 'pagado') { pagados++; recaudado += pg.monto; }
          else pendientes++;
        });
      });
    });
    return { pagados, pendientes, recaudado, alumnos: alumnosUnicos.size };
  }, [talleresGrid, mesesKey]);

  const pendientesCount = talleresGrid.reduce((acc, t) =>
    acc + t.alumnos.filter(a => !a.pagos[mesActualKey]).length, 0);

  const talleresFiltrados = React.useMemo(() => {
    return talleresGrid.map(t => ({
      ...t,
      alumnos: filtroMensual === 'pendientes'
        ? t.alumnos.filter(a => !a.pagos[mesActualKey])
        : t.alumnos,
    })).filter(t => t.alumnos.length > 0);
  }, [talleresGrid, filtroMensual, mesActualKey]);

  // ── Movimientos
  const reload = () => {
    api.getPayments().then(data => {
      setPagos(data.pagos || []);
      setMetodos(data.metodos || []);
    }).catch(() => {});
  };
  React.useEffect(() => { reload(); }, []);

  const filtered = pagos.filter(p => {
    if (filter !== 'todos' && p.estado !== filter) return false;
    if (tipoFilter !== 'todos' && (p.tipo || 'mensualidad') !== tipoFilter) return false;
    return true;
  });

  const stats = React.useMemo(() => {
    const pagado    = pagos.filter(p => p.estado === 'pagado').reduce((a, p) => a + p.monto, 0);
    const pendiente = pagos.filter(p => p.estado === 'pendiente').reduce((a, p) => a + p.monto, 0);
    const vencido   = pagos.filter(p => p.estado === 'vencido').reduce((a, p) => a + p.monto, 0);
    return { pagado, pendiente, vencido, morosos: pagos.filter(p => p.estado === 'vencido').length };
  }, [pagos]);

  const handleCobrar = async (pago, e) => {
    e.stopPropagation();
    try {
      await api.updatePayment(pago.id, { estado: 'pagado', metodo: 'Efectivo' });
      setPagos(prev => prev.map(p => p.id === pago.id ? { ...p, estado: 'pagado', metodo: 'Efectivo' } : p));
      onToast(`Pago de ${(pago.socio || '').split(' ')[0]} registrado`);
    } catch (e) { onToast('Error: ' + e.message); }
  };

  const estadoPill = (estado) => ({ pagado: 'present', pendiente: 'late', vencido: 'absent', reembolsado: 'muted' }[estado] || 'muted');

  const TIPO_INFO = {
    mensualidad: { icon: '📅', label: 'Mensualidades', bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
    donacion:    { icon: '❤️', label: 'Donaciones',    bg: 'var(--present-soft)', color: 'var(--present)' },
    beneficio:   { icon: '🎉', label: 'Beneficios',    bg: 'var(--late-soft)',    color: 'var(--ink)' },
    otro:        { icon: '📦', label: 'Otros fondos',  bg: 'var(--surface-2)',    color: 'var(--ink-2)' },
  };

  const metodosVis = metodos.length > 0 ? metodos : [
    { metodo: 'Transferencia', pct: 42, total: 482000 },
    { metodo: 'Tarjeta',       pct: 35, total: 402500 },
    { metodo: 'Efectivo',      pct: 18, total: 207000 },
  ];
  const totalMetodos = metodosVis.reduce((a, m) => a + (m.total || 0), 1);
  const colores = ['var(--accent)', 'var(--ink)', 'var(--late)', 'var(--present)'];

  const cellBase = {
    textAlign: 'center', padding: '10px 6px',
    borderLeft: '1px solid var(--line)', fontSize: 11, lineHeight: 1.3,
  };

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Módulo</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>Pagos</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Icon.mail size={14}/> Recordatorios</Button>
          <Button size="sm" onClick={() => setRegModal(true)}>
            <Icon.plus size={14}/> Registrar pago
          </Button>
        </div>
      </div>

      {/* ═══ SECCIÓN MENSUALIDADES (colapsable) ═══ */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setMensualOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: mensualOpen ? 'var(--ink)' : 'var(--surface-2)',
            color: mensualOpen ? 'var(--bg)' : 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 10, padding: '10px 16px',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13,
            marginBottom: mensualOpen ? 14 : 0,
            transition: 'all 0.2s',
          }}
        >
          <Icon.calendar size={16}/>
          <span style={{ flex: 1 }}>Mensualidades por taller · {rangeLabel}</span>
          {!mensualOpen && pendientesCount > 0 && (
            <span style={{ background: 'var(--absent)', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
              {pendientesCount} pendientes
            </span>
          )}
          <Icon.chevronRight size={16} style={{ transform: mensualOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }}/>
        </button>

        {mensualOpen && (
          <>
            {/* Navegador de meses */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button onClick={() => setWindowOffset(o => o - 1)} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--ink-2)' }}>
                <Icon.chevronLeft size={16}/>
              </button>
              <div className="display" style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', minWidth: 210, textAlign: 'center' }}>{rangeLabel}</div>
              <button onClick={() => setWindowOffset(o => Math.min(o + 1, 0))} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', cursor: windowOffset === 0 ? 'not-allowed' : 'pointer', color: 'var(--ink-2)', opacity: windowOffset === 0 ? 0.35 : 1 }}>
                <Icon.chevronRight size={16}/>
              </button>
            </div>

            {/* KPIs globales */}
            {!loadingMensual && talleresGrid.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                <Kpi label="Alumnos inscriptos" value={globalStats.alumnos}/>
                <div className="card" style={{ padding: 14, background: 'var(--present-soft)', border: '1px solid color-mix(in oklab, var(--present) 25%, transparent)' }}>
                  <div style={{ fontSize: 10, color: 'var(--present)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cuotas cobradas</div>
                  <div className="display tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 4, color: 'var(--present)' }}>{globalStats.pagados}</div>
                </div>
                <div className="card" style={{ padding: 14, background: 'var(--absent-soft)', border: '1px solid color-mix(in oklab, var(--absent) 25%, transparent)' }}>
                  <div style={{ fontSize: 10, color: 'var(--absent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cuotas pendientes</div>
                  <div className="display tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 4, color: 'var(--absent)' }}>{globalStats.pendientes}</div>
                </div>
                <Kpi label="Total recaudado" value={'$ ' + globalStats.recaudado.toLocaleString('es-AR')}/>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Segmented value={filtroMensual} onChange={setFiltroMensual}
                options={[
                  { value: 'todos', label: 'Todos los alumnos' },
                  { value: 'pendientes', label: `Sin pago este mes (${pendientesCount})` },
                ]}/>
            </div>

            {loadingMensual && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando datos…</div>}
            {!loadingMensual && talleresFiltrados.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>
                {filtroMensual === 'pendientes' ? '✓ Todos al día en el mes actual.' : 'Sin inscriptos en ningún taller.'}
              </div>
            )}

            {/* Grilla por taller */}
            {!loadingMensual && talleresFiltrados.map(taller => {
              const totalesMes = meses.map(mes => ({
                pagados:    taller.alumnos.filter(a => a.pagos[mes.key]?.estado === 'pagado').length,
                pendientes: taller.alumnos.filter(a => !a.pagos[mes.key]).length,
                monto:      taller.alumnos.reduce((s, a) => s + (a.pagos[mes.key]?.estado === 'pagado' ? a.pagos[mes.key].monto : 0), 0),
              }));
              const totalGeneral = {
                pagados: totalesMes.reduce((s, t) => s + t.pagados, 0),
                monto:   totalesMes.reduce((s, t) => s + t.monto, 0),
              };
              return (
                <div key={taller.id} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: taller.color || 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{taller.emoji || '🏃'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{taller.nombre}</div>
                      {taller.horario && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{taller.horario}</div>}
                    </div>
                    <span className="pill pill-present tnum">{totalGeneral.pagados} cobradas</span>
                    <span className="pill pill-absent tnum">{totalesMes[totalesMes.length - 1].pendientes} pendientes</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)', minWidth: 620 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <th style={{ padding: '7px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', minWidth: 180 }}>Alumno</th>
                          {meses.map(mes => (
                            <th key={mes.key} style={{ ...cellBase, padding: '7px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: mes.key === mesActualKey ? 'var(--accent)' : 'var(--ink-3)', borderBottom: '1px solid var(--line)', minWidth: 74, background: mes.key === mesActualKey ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
                              {mes.label}<br/><span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>{mes.year}</span>
                            </th>
                          ))}
                          <th style={{ padding: '7px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', borderLeft: '2px solid var(--line)', minWidth: 68, background: 'var(--surface-2)' }}>Pagó</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taller.alumnos.map(a => {
                          const cuotasPagadas = meses.filter(mes => a.pagos[mes.key]?.estado === 'pagado').length;
                          const totalPagado = meses.reduce((s, mes) => s + (a.pagos[mes.key]?.estado === 'pagado' ? a.pagos[mes.key].monto : 0), 0);
                          return (
                            <tr key={a.participante_id} style={{ borderBottom: '1px solid var(--line)', background: !a.pagos[mesActualKey] ? 'color-mix(in oklab, var(--absent) 3%, transparent)' : 'transparent' }}>
                              <td style={{ padding: '9px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Avatar name={a.nombre} bg={a.avatar_bg} initials={a.iniciales} size={26}/>
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.nombre}</span>
                                </div>
                              </td>
                              {meses.map(mes => {
                                const pg = a.pagos[mes.key];
                                const esMesActual = mes.key === mesActualKey;
                                if (pg?.estado === 'pagado') return (
                                  <td key={mes.key} style={{ ...cellBase, background: 'color-mix(in oklab, var(--present) 12%, transparent)', color: 'var(--present)' }}>
                                    <div style={{ fontSize: 14 }}>✓</div>
                                    <div className="tnum" style={{ fontSize: 10, fontWeight: 600, marginTop: 1 }}>$ {(pg.monto / 1000).toFixed(0)}k</div>
                                  </td>
                                );
                                if (pg) return (
                                  <td key={mes.key} style={{ ...cellBase, background: 'color-mix(in oklab, var(--late) 12%, transparent)', color: 'var(--late)' }}>
                                    <div style={{ fontSize: 13 }}>⏱</div>
                                  </td>
                                );
                                return (
                                  <td key={mes.key} title={`Registrar ${mes.label} ${mes.year} — ${a.nombre}`}
                                    style={{ ...cellBase, background: esMesActual ? 'color-mix(in oklab, var(--absent) 8%, transparent)' : 'transparent', cursor: 'pointer' }}
                                    onClick={() => setPagoModal({ taller, alumno: a, mes })}>
                                    <div style={{ fontSize: 13, color: esMesActual ? 'var(--absent)' : 'var(--ink-3)' }}>{esMesActual ? '✗' : '·'}</div>
                                    {esMesActual && <div style={{ fontSize: 9, color: 'var(--absent)', marginTop: 1 }}>pendiente</div>}
                                  </td>
                                );
                              })}
                              <td style={{ textAlign: 'center', padding: '9px 10px', borderLeft: '2px solid var(--line)', background: 'var(--surface-2)' }}>
                                <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: cuotasPagadas === meses.length ? 'var(--present)' : cuotasPagadas === 0 ? 'var(--absent)' : 'var(--ink)' }}>
                                  {cuotasPagadas}/{meses.length}
                                </div>
                                {totalPagado > 0 && <div className="tnum" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>$ {totalPagado.toLocaleString('es-AR')}</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'color-mix(in oklab, var(--ink) 4%, var(--surface-2))', borderTop: '2px solid var(--line)' }}>
                          <td style={{ padding: '9px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Totales</td>
                          {totalesMes.map((tot, i) => (
                            <td key={meses[i].key} style={{ ...cellBase, background: meses[i].key === mesActualKey ? 'color-mix(in oklab, var(--accent) 8%, var(--surface-2))' : 'transparent', fontWeight: 700 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--present)' }}>{tot.pagados} ✓</div>
                              {tot.pendientes > 0 && <div style={{ fontSize: 10, color: 'var(--absent)', marginTop: 1 }}>{tot.pendientes} ✗</div>}
                              <div className="tnum" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>{tot.monto > 0 ? `$${(tot.monto/1000).toFixed(0)}k` : '—'}</div>
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', padding: '9px 10px', borderLeft: '2px solid var(--line)', background: 'var(--surface-2)' }}>
                            <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--present)' }}>{totalGeneral.pagados}</div>
                            <div className="tnum" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>$ {totalGeneral.monto.toLocaleString('es-AR')}</div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ═══ MOVIMIENTOS ═══ */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Todos los movimientos</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <Kpi label="Cobrado (mes)" value={'$ ' + (stats.pagado/1000).toFixed(0) + 'k'} delta={8} sparkValues={REPORTES.ingresosMes.slice(-8)}/>
          <Kpi label="Pendiente"     value={'$ ' + (stats.pendiente/1000).toFixed(0) + 'k'}/>
          <Kpi label="Vencido"       value={'$ ' + (stats.vencido/1000).toFixed(0) + 'k'} delta={-5} deltaPositive={false}/>
          <Kpi label="Morosos"       value={stats.morosos}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Métodos de pago</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {metodosVis.map((m, i) => {
                const pct = metodos.length > 0 ? Math.round((m.total / totalMetodos) * 100) : m.pct;
                return (
                  <div key={m.metodo || i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{m.metodo}</span>
                      <span className="tnum" style={{ color: 'var(--ink-3)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--line)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colores[i] || 'var(--accent)', transition: 'width 0.5s ease' }}/>
                    </div>
                    <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>$ {(m.total || 0).toLocaleString('es-AR')}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Cobranzas últimos 12 meses</div>
                <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  $ {(REPORTES.ingresosMes || []).reduce((a,b)=>a+b,0).toLocaleString('es-AR')}k
                </div>
              </div>
              <span className="pill pill-present">↑ 8%</span>
            </div>
            <BarChart values={REPORTES.ingresosMes || [0]} labels={['E','F','M','A','M','J','J','A','S','O','N','D']} height={110}/>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filtros */}
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
            <Segmented value={filter} onChange={setFilter}
              options={[
                { value: 'todos',     label: 'Todos' },
                { value: 'pagado',    label: 'Pagados' },
                { value: 'pendiente', label: 'Pendientes' },
                { value: 'vencido',   label: 'Vencidos' },
              ]}/>
            <div style={{ width: 1, height: 20, background: 'var(--line)', flexShrink: 0 }}/>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { v: 'todos',       l: 'Todo tipo' },
                { v: 'mensualidad', l: '📅 Cuotas' },
                { v: 'donacion',    l: '❤️ Donaciones' },
                { v: 'beneficio',   l: '🎉 Beneficios' },
                { v: 'otro',        l: '📦 Otros' },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => setTipoFilter(v)} style={{
                  padding: '5px 10px', borderRadius: 6, border: `1px solid ${tipoFilter === v ? 'var(--accent)' : 'var(--line)'}`,
                  background: tipoFilter === v ? 'var(--accent-soft)' : 'transparent',
                  color: tipoFilter === v ? 'var(--accent-ink)' : 'var(--ink-3)',
                  fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['Socio', 'Concepto', 'Fecha', 'Monto', 'Método', 'Tipo', 'Estado', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin pagos para mostrar</td></tr>}
              {filtered.map((p, i) => {
                const tipo = p.tipo || 'mensualidad';
                const ti = TIPO_INFO[tipo] || TIPO_INFO.otro;
                return (
                  <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 0, cursor: 'pointer', background: selected === p.id ? 'var(--accent-soft)' : 'transparent' }} onClick={() => setSelected(p.id === selected ? null : p.id)}>
                    <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600 }}>{p.socio || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{p.concepto}</div>
                      {p.comentario && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{p.comentario}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--ink-3)' }}>{formatDateES(p.fecha)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right', fontWeight: 600 }} className="tnum">$ {p.monto.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-2)' }}>{p.metodo || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: ti.bg, color: ti.color, fontSize: 11, fontWeight: 600 }}>
                        <span>{ti.icon}</span><span>{tipo}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}><span className={`pill pill-${estadoPill(p.estado)}`}><span className="dot" style={{ background: 'currentColor' }}/>{p.estado}</span></td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {(p.estado === 'pendiente' || p.estado === 'vencido') ? (
                        <Button size="sm" onClick={(e) => handleCobrar(p, e)}>Cobrar</Button>
                      ) : (
                        <button onClick={e => e.stopPropagation()} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.dotsV size={16}/></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen por tipo */}
        {pagos.length > 0 && (() => {
          const TIPOS_LIST = ['mensualidad', 'donacion', 'beneficio', 'otro'];
          const resumen = TIPOS_LIST.map(tipo => {
            const tipoData = pagos.filter(p => (p.tipo || 'mensualidad') === tipo);
            if (tipoData.length === 0) return null;
            return {
              tipo,
              count: tipoData.length,
              total: tipoData.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0),
              pendiente: tipoData.filter(p => p.estado !== 'pagado').length,
            };
          }).filter(Boolean);
          if (resumen.length === 0) return null;
          const totalTodos = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
          return (
            <div className="card" style={{ padding: 18, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div className="eyebrow">Resumen por tipo</div>
                <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--present)' }}>
                  Total recaudado: $ {totalTodos.toLocaleString('es-AR')}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {resumen.map(r => {
                  const info = TIPO_INFO[r.tipo] || TIPO_INFO.otro;
                  return (
                    <div key={r.tipo} style={{ padding: 14, borderRadius: 10, background: info.bg, border: '1px solid var(--line)', color: info.color }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{info.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8, marginBottom: 4 }}>{info.label}</div>
                      <div className="tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>$ {r.total.toLocaleString('es-AR')}</div>
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.75 }}>
                        {r.count} movimiento{r.count !== 1 ? 's' : ''}
                        {r.pendiente > 0 ? ` · ${r.pendiente} pendiente${r.pendiente !== 1 ? 's' : ''}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal mensualidad desde grilla */}
      {pagoModal && (
        <RegistrarMensualidadAdminModal
          info={{ taller: pagoModal.taller, alumno: pagoModal.alumno }}
          periodo={pagoModal.mes.key}
          periodoLabel={`${MESES_LARGOS[pagoModal.mes.month]} ${pagoModal.mes.year}`}
          onClose={() => setPagoModal(null)}
          onSave={(pg) => {
            const { mes, taller, alumno } = pagoModal;
            setMensualData(prev => {
              const entry = prev[mes.key];
              if (!entry) return prev;
              return {
                ...prev,
                [mes.key]: {
                  ...entry,
                  talleres: entry.talleres.map(t => t.id !== taller.id ? t : {
                    ...t,
                    inscritos: t.inscritos.map(a =>
                      a.participante_id !== alumno.participante_id ? a : { ...a, pago: pg }
                    ),
                  }),
                },
              };
            });
            setPagoModal(null);
            onToast(`Pago registrado · ${alumno.nombre.split(' ')[0]}`);
          }}
          onToast={onToast}
        />
      )}

      {/* Modal registrar pago/ingreso */}
      {regModal && (
        <RegistrarPagoModal
          onClose={() => setRegModal(false)}
          onSave={(nuevoPago) => { setPagos(prev => [nuevoPago, ...prev]); setRegModal(false); onToast('Pago registrado · ' + (nuevoPago.concepto || nuevoPago.comprobante)); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function RegistrarMensualidadAdminModal({ info, periodo, periodoLabel, onClose, onSave, onToast }) {
  const { taller, alumno } = info;
  const [monto, setMonto] = React.useState('');
  const [metodo, setMetodo] = React.useState('Transferencia');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!monto || Number(monto) <= 0) { onToast('Ingrese el monto'); return; }
    setSaving(true);
    try {
      const pg = await api.registerPayment({
        participante_id: alumno.participante_id,
        taller_id: taller.id,
        monto: Number(monto),
        metodo,
        periodo,
        concepto: `Mensualidad ${periodoLabel}`,
      });
      onSave(pg);
    } catch (e) {
      onToast('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: taller.color || 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {taller.emoji || '💰'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{taller.nombre} · {periodoLabel}</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Registrar mensualidad</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
            <Avatar name={alumno.nombre} bg={alumno.avatar_bg} initials={alumno.iniciales} size={36}/>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{alumno.nombre}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Mensualidad {periodoLabel}</div>
            </div>
          </div>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Monto</div>
            <input className="input tnum" placeholder="$ 0" type="number" autoFocus value={monto} onChange={e => setMonto(e.target.value)}/>
          </label>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Método de pago</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Transferencia', 'Tarjeta', 'Efectivo', 'Mercado Pago'].map(m => (
                <button key={m} className="tweaks-chip" aria-pressed={metodo === m} onClick={() => setMetodo(m)} style={{ flex: '1 0 45%' }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Confirmar pago'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrarPagoModal({ onClose, onSave, onToast }) {
  const [form, setForm] = React.useState({
    tipo: 'mensualidad', concepto: '', monto: '',
    metodo: 'Transferencia', periodo: new Date().toISOString().slice(0, 7), comentario: '',
  });
  const [participanteQ, setParticipanteQ] = React.useState('');
  const [participanteResults, setParticipanteResults] = React.useState([]);
  const [selectedParticipante, setSelectedParticipante] = React.useState(null);
  const [talleres, setTalleres] = React.useState([]);
  const [selectedTallerId, setSelectedTallerId] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.getWorkshops().then(ws => setTalleres(ws || [])).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!participanteQ || participanteQ.length < 2) { setParticipanteResults([]); return; }
    const timer = setTimeout(() => {
      api.searchParticipants(participanteQ)
        .then(r => setParticipanteResults(r || []))
        .catch(() => setParticipanteResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [participanteQ]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const TIPOS = [
    { id: 'mensualidad', label: 'Mensualidad', icon: '📅' },
    { id: 'donacion',    label: 'Donación',    icon: '❤️' },
    { id: 'beneficio',   label: 'Beneficio',   icon: '🎉' },
    { id: 'otro',        label: 'Otro',        icon: '📦' },
  ];

  const handleSave = async () => {
    if (!form.monto || Number(form.monto) <= 0) { onToast('Ingrese el monto'); return; }
    setSaving(true);
    try {
      const pago = await api.registerPayment({
        participante_id: selectedParticipante?.id || null,
        taller_id: selectedTallerId || null,
        tipo: form.tipo,
        concepto: form.concepto || null,
        monto: Number(form.monto),
        metodo: form.metodo,
        periodo: form.tipo === 'mensualidad' ? form.periodo : null,
        comentario: form.comentario || null,
      });
      onSave(pago);
    } catch (e) {
      onToast('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500, padding: 20 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.plus size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nuevo movimiento</div>
            <div className="display" style={{ fontSize: 17, fontWeight: 700 }}>Registrar pago / ingreso</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
        </div>
        <div style={{ padding: 20, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Tipo de ingreso</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => set('tipo', t.id)} style={{
                  padding: '10px 6px', borderRadius: 8, border: `1px solid ${form.tipo === t.id ? 'var(--accent)' : 'var(--line)'}`,
                  background: form.tipo === t.id ? 'var(--accent-soft)' : 'var(--surface-2)',
                  color: form.tipo === t.id ? 'var(--accent-ink)' : 'var(--ink-2)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11,
                  textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Socio (opcional)</div>
            {selectedParticipante ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <Avatar name={selectedParticipante.nombre} bg={selectedParticipante.avatar_bg} initials={selectedParticipante.iniciales} size={28}/>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{selectedParticipante.nombre}</span>
                <button onClick={() => { setSelectedParticipante(null); setParticipanteQ(''); }} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}><Icon.x size={14}/></button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <Icon.search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}/>
                  <input className="input" placeholder="Buscar por nombre…" style={{ paddingLeft: 36 }} value={participanteQ} onChange={e => setParticipanteQ(e.target.value)}/>
                </div>
                {participanteResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 10, width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: 'var(--shadow)', marginTop: 4, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                    {participanteResults.map((p, i) => (
                      <button key={p.id} onClick={() => { setSelectedParticipante(p); setParticipanteQ(''); setParticipanteResults([]); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: 'transparent', border: 0, borderBottom: i < participanteResults.length - 1 ? '1px solid var(--line)' : 0, cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Avatar name={p.nombre} bg={p.avatar_bg} initials={p.iniciales} size={26}/>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Taller (opcional)</div>
            <select className="input" value={selectedTallerId} onChange={e => setSelectedTallerId(e.target.value)}>
              <option value="">— Sin taller asociado —</option>
              {talleres.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nombre}</option>)}
            </select>
          </div>

          {form.tipo === 'mensualidad' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Período</div>
                <input className="input tnum" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)}/>
              </label>
              <label>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Monto</div>
                <input className="input tnum" placeholder="$ 0" type="number" value={form.monto} onChange={e => set('monto', e.target.value)}/>
              </label>
            </div>
          ) : (
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Monto</div>
              <input className="input tnum" placeholder="$ 0" type="number" value={form.monto} onChange={e => set('monto', e.target.value)}/>
            </label>
          )}

          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Concepto</div>
            <input className="input" placeholder="Ej. Torneo verano 2025" value={form.concepto} onChange={e => set('concepto', e.target.value)}/>
          </label>

          {form.tipo !== 'mensualidad' && (
            <label>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Comentario / Detalle</div>
              <textarea className="input" placeholder="Describe el origen de este ingreso…" rows={2} value={form.comentario} onChange={e => set('comentario', e.target.value)} style={{ resize: 'vertical', minHeight: 60, fontFamily: 'var(--font-ui)' }}/>
            </label>
          )}

          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Método</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Transferencia', 'Tarjeta', 'Efectivo', 'Mercado Pago'].map(m => (
                <button key={m} className="tweaks-chip" aria-pressed={form.metodo === m} onClick={() => set('metodo', m)} style={{ flex: '1 0 45%' }}>{m}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando…' : 'Registrar ingreso'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminPagos });
