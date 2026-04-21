// ──────────────────────────────────────────────────────────────
// Dashboard — 3 layouts: cards | lista | grid
// ──────────────────────────────────────────────────────────────

function WorkshopCard({ workshop, onOpen, layout }) {
  const ocupados = workshop.participantesIds.length;
  const pct = (ocupados / workshop.cupo) * 100;
  const cuposLibres = workshop.cupo - ocupados;

  if (layout === 'lista') {
    return (
      <button onClick={() => onOpen(workshop)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 'var(--density-y) var(--density-x)',
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-md)', width: '100%', cursor: 'pointer',
        textAlign: 'left', fontFamily: 'var(--font-ui)',
        transition: 'transform 0.12s ease, border-color 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: workshop.color, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22,
          flexShrink: 0,
        }}>{workshop.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>{workshop.nombre}</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--ink-2)' }}>
            <span className="tnum">{workshop.hora}</span>
            <span>·</span>
            <span className="tnum">{ocupados}/{workshop.cupo}</span>
          </div>
        </div>
        <Icon.chevronRight size={18} style={{ color: 'var(--ink-3)' }}/>
      </button>
    );
  }

  if (layout === 'grid') {
    return (
      <button onClick={() => onOpen(workshop)} style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)', padding: 14, cursor: 'pointer',
        textAlign: 'left', fontFamily: 'var(--font-ui)',
        display: 'flex', flexDirection: 'column', gap: 10, aspectRatio: '1/1',
        transition: 'transform 0.12s ease, border-color 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: workshop.color, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{workshop.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.2 }}>{workshop.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{workshop.hora}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="display tnum" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{ocupados}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>de {workshop.cupo}</div>
          </div>
          <CupoBar ocupados={ocupados} total={workshop.cupo}/>
        </div>
      </button>
    );
  }

  // Default: cards
  return (
    <button onClick={() => onOpen(workshop)} className="card" style={{
      padding: 16, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'transform 0.12s ease, box-shadow 0.15s ease',
      width: '100%', border: '1px solid var(--line)',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: workshop.color, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 26,
          flexShrink: 0,
        }}>{workshop.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 4, lineHeight: 1.2 }}>{workshop.nombre}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
            <Icon.calendar size={13}/>
            <span>{workshop.horario}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
            <Icon.clock size={13}/>
            <span className="tnum">{workshop.hora}</span>
          </div>
        </div>
        {workshop.proxima === 'Hoy, 17:00' && (
          <span className="pill pill-accent">Hoy</span>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="display tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{ocupados}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>de {workshop.cupo} participantes</span>
          </div>
          <span className="pill pill-muted tnum">{cuposLibres} libres</span>
        </div>
        <CupoBar ocupados={ocupados} total={workshop.cupo}/>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px dashed var(--line)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
          {workshop.sede}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--accent-ink)' }}>
          Ver participantes <Icon.arrowRight size={14}/>
        </span>
      </div>
    </button>
  );
}

function Dashboard({ layout, onOpenWorkshop, onOpenProfile, empty }) {
  const workshops = empty ? [] : WORKSHOPS;
  const totalParticipantes = workshops.reduce((a, w) => a + w.participantesIds.length, 0);
  const clasesHoy = workshops.filter(w => w.proxima.startsWith('Hoy')).length;

  return (
    <>
      {/* Saludo + resumen */}
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.02em', marginBottom: 2 }}>
          {formatDateES(todayISO())}
        </div>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>
          Hola, {PROFESSOR.nombre.split(' ')[0]}.
        </h1>

        {!empty && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            padding: 14, background: 'var(--ink)', borderRadius: 'var(--r-lg)',
            color: 'var(--bg)',
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'color-mix(in oklab, var(--bg) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Talleres</div>
              <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{workshops.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'color-mix(in oklab, var(--bg) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Alumnos</div>
              <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{totalParticipantes}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'color-mix(in oklab, var(--bg) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Hoy</div>
              <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--accent)' }}>{clasesHoy}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 24px', flex: 1 }}>
        {empty ? (
          <EmptyState/>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="eyebrow">Sus talleres</div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{workshops.length} activos</span>
            </div>

            <div style={{
              display: layout === 'grid' ? 'grid' : 'flex',
              flexDirection: 'column',
              gridTemplateColumns: layout === 'grid' ? '1fr 1fr' : undefined,
              gap: layout === 'lista' ? 8 : 12,
            }}>
              {workshops.map(w => (
                <WorkshopCard key={w.id} workshop={w} onOpen={onOpenWorkshop} layout={layout}/>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: '32px 20px', textAlign: 'center',
      border: '1px dashed var(--line-2)', borderRadius: 'var(--r-lg)',
      marginTop: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--surface-2)', color: 'var(--ink-3)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <Icon.calendar size={24}/>
      </div>
      <div className="display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Aún no tiene talleres</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 260, margin: '0 auto 16px' }}>
        La administración del club le asignará talleres próximamente. Recibirá una notificación por correo.
      </div>
      <Button variant="secondary" size="sm">Contactar administración</Button>
    </div>
  );
}

// ── Agenda del profesor
function ProfesorAgendaScreen({ onBack }) {
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIA_KEY = { 'lun':'Lun','mar':'Mar','mié':'Mié','mie':'Mié','jue':'Jue','vie':'Vie','sáb':'Sáb','sab':'Sáb','dom':'Dom' };
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  // Lun=0 … Dom=6, JS getDay() devuelve Dom=0 Lun=1 … Sáb=6
  const JS_TO_IDX = [6,0,1,2,3,4,5]; // convierte getDay() → índice DIAS
  const [integrantesModal, setIntegrantesModal] = React.useState(null);

  const parseDias = (horario) => {
    if (!horario) return [];
    return horario.split(/[\s·,]+/).map(s => s.trim().toLowerCase().slice(0,3))
      .map(s => DIA_KEY[s]).filter(Boolean);
  };

  const byDia = {};
  DIAS.forEach(d => { byDia[d] = []; });
  WORKSHOPS.forEach(t => {
    parseDias(t.horario).forEach(d => { if (byDia[d]) byDia[d].push(t); });
  });
  DIAS.forEach(d => { byDia[d].sort((a,b) => (a.hora||'').localeCompare(b.hora||'')); });

  const hoy = new Date();
  // Día de la semana actual (índice en DIAS[])
  const diaHoyIdx = JS_TO_IDX[hoy.getDay()];
  const diaHoy = DIAS[diaHoyIdx];

  // Lunes de la semana actual
  const lunesActual = new Date(hoy);
  lunesActual.setDate(hoy.getDate() - diaHoyIdx);
  const domActual = new Date(lunesActual);
  domActual.setDate(lunesActual.getDate() + 6);
  const fmtFecha = (d) => d.toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const semanaLabel = `${fmtFecha(lunesActual)} – ${fmtFecha(domActual)}`;

  // Helper: genera filas HTML de talleres para impresión
  const tallerRows = (lista) => lista.map(t => `
    <div style="margin-bottom:22px;break-inside:avoid">
      <div style="background:#1a1a2e;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:12px">
        <span style="font-size:20px">${t.emoji||'🏃'}</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700">${t.nombre}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px">${t.horario||''} · ${t.hora||''} · ${t.sede||''}</div>
        </div>
        <div style="text-align:right;font-size:12px">
          <div style="font-size:17px;font-weight:700">${(t.participantesIds||[]).length}</div>
          <div style="color:#aaa">alumnos</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e0e0e0;border-top:0">
        <thead><tr style="background:#e8e8f0">
          <th style="padding:5px 10px;text-align:left;font-size:11px;width:28px">#</th>
          <th style="padding:5px 10px;text-align:left;font-size:11px">Nombre</th>
          <th style="padding:5px 10px;text-align:left;font-size:11px">Estado</th>
        </tr></thead>
        <tbody>${(t.participantes||[]).length > 0
          ? (t.participantes||[]).map((p,i) => `<tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
              <td style="padding:4px 10px">${i+1}</td>
              <td style="padding:4px 10px;font-weight:600">${p.nombre||p}</td>
              <td style="padding:4px 10px"><span style="padding:2px 7px;border-radius:4px;font-size:10px;background:#d4f7e0;color:#166534">${p.estado||'activo'}</span></td>
            </tr>`).join('')
          : '<tr><td colspan="3" style="padding:8px;text-align:center;color:#999;font-style:italic">Sin alumnos registrados</td></tr>'
        }</tbody>
      </table>
    </div>`).join('');

  const printHTML = (titulo, subtitulo, rows) => {
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
      <title>${titulo}</title>
      <style>*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#1a1a2e;margin:0}
      h1{font-size:19px;margin:0 0 3px}.sub{font-size:12px;color:#666;margin-bottom:18px}
      @media print{.no-print{display:none}body{padding:12px}}</style></head><body>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #1a1a2e">
        <div><h1>${titulo}</h1><div class="sub">${subtitulo}</div></div>
      </div>
      ${rows}
      <div class="no-print" style="margin-top:20px;text-align:center">
        <button onclick="window.print()" style="padding:10px 28px;background:#1a1a2e;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer;margin-right:8px">🖨 Imprimir</button>
        <button onclick="window.close()" style="padding:10px 28px;background:#eee;color:#333;border:0;border-radius:8px;font-size:14px;cursor:pointer">Cerrar</button>
      </div></body></html>`;
    const w = window.open('','_blank','width=900,height=700');
    w.document.write(html); w.document.close();
  };

  const handlePrintDia = (dia) => {
    const lista = byDia[dia] || [];
    if (!lista.length) { alert('No hay talleres ese día'); return; }
    printHTML(
      `Agenda del ${dia} — ${PROFESSOR.nombre}`,
      `Generado el ${hoy.toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · ${lista.length} taller${lista.length!==1?'es':''}`,
      tallerRows(lista)
    );
  };

  const handlePrintSemana = () => {
    const seccionesHTML = DIAS.map(dia => {
      const lista = byDia[dia] || [];
      if (!lista.length) return '';
      return `<div style="margin-bottom:28px">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#555;padding:6px 0;border-bottom:1px solid #ddd;margin-bottom:12px">${dia}</div>
        ${tallerRows(lista)}
      </div>`;
    }).join('');
    const total = WORKSHOPS.length;
    printHTML(
      `Agenda semanal — ${semanaLabel} — ${PROFESSOR.nombre}`,
      `Generado el ${hoy.toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · ${total} taller${total!==1?'es':''}`,
      seccionesHTML || '<p style="color:#999;text-align:center">Sin talleres esta semana</p>'
    );
  };

  const handlePrintMes = () => {
    const mesLabel = MESES[hoy.getMonth()] + ' ' + hoy.getFullYear();
    printHTML(
      `Agenda mensual — ${mesLabel} — ${PROFESSOR.nombre}`,
      `Generado el ${hoy.toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · ${WORKSHOPS.length} taller${WORKSHOPS.length!==1?'es':''}`,
      tallerRows(WORKSHOPS)
    );
  };

  const btnStyle = { background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--ink-2)' };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, color: 'var(--ink-2)', display: 'inline-flex' }}>
          <Icon.arrowLeft size={18}/>
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Mi panel</div>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Mi agenda</h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => handlePrintDia(diaHoy)} style={btnStyle}>🖨 Hoy</button>
          <button onClick={handlePrintSemana} style={btnStyle}>🖨 Semana</button>
          <button onClick={handlePrintMes} style={btnStyle}>🖨 Mes</button>
        </div>
      </div>

      {WORKSHOPS.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>No tenés talleres asignados</div>
      ) : (
        <div style={{ padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DIAS.map(dia => {
            const talleresDia = byDia[dia];
            if (talleresDia.length === 0) return null;
            const esHoy = dia === diaHoy;
            return (
              <div key={dia}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: esHoy ? 'var(--accent-ink)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {esHoy && <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>HOY</span>}
                    {dia}
                    <span style={{ background: 'var(--surface-2)', borderRadius: 999, padding: '1px 6px', fontSize: 10, color: 'var(--ink-3)' }}>
                      {talleresDia.length}
                    </span>
                  </div>
                  <button onClick={() => handlePrintDia(dia)} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-ui)', padding: '2px 6px' }}>
                    🖨 imprimir
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {talleresDia.map(t => (
                    <button key={t.id} onClick={() => setIntegrantesModal(t)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12,
                      border: `1px solid ${esHoy ? 'var(--accent)' : 'var(--line)'}`,
                      background: esHoy ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', width: '100%',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color||'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{t.emoji||'🏃'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{t.nombre}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t.hora||''}{t.sede ? ' · '+t.sede : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{(t.participantesIds||[]).length}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>alumnos</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {integrantesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2500, padding: '0 0 0' }} onClick={() => setIntegrantesModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: integrantesModal.color||'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{integrantesModal.emoji||'🏃'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{integrantesModal.nombre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{integrantesModal.hora||''}{integrantesModal.sede ? ' · '+integrantesModal.sede : ''}</div>
              </div>
              <button onClick={() => setIntegrantesModal(null)} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}><Icon.x size={18}/></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {(integrantesModal.participantes||[]).length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Sin alumnos registrados</div>
              ) : (integrantesModal.participantes||[]).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--surface-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', flexShrink: 0 }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nombre||p}</div>
                    {p.dni && <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>DNI {p.dni}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'var(--present-soft)', color: 'var(--present)' }}>{p.estado||'activo'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Dashboard, WorkshopCard, EmptyState, ProfesorAgendaScreen });
