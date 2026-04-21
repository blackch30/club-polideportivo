// ──────────────────────────────────────────────────────────────
// Datos Admin — cargados desde la API
// ──────────────────────────────────────────────────────────────

// Estado global mutable
let PROFESORES_ADMIN = [];
let INSCRIPCIONES = [];
let EMPRESA = {};
let REPORTES = { inscripcionesMes: [], ingresosMes: [], asistenciaPorDisciplina: [] };
let PAGOS_DATA = [];
let INITIAL_LINKS = {};

// Carga todos los datos del panel admin
async function initAdminData() {
  try {
    const [profesores, inscripciones, empresa, dashboard, attendance, revenue] = await Promise.all([
      api.getProfessors(),
      api.getInscriptions(),
      api.getCompany(),
      api.getDashboardReport(),
      api.getAttendanceReport(),
      api.getRevenueReport(12),
    ]);

    PROFESORES_ADMIN = profesores;
    INSCRIPCIONES = inscripciones;
    EMPRESA = { ...empresa, sedes: empresa.sedes || [] };

    REPORTES = {
      inscripcionesMes: Array(12).fill(0).map((_, i) => Math.floor(Math.random() * 60 + 40)), // placeholder visual
      ingresosMes: revenue.map(r => Math.round(r.total / 1000)),
      asistenciaPorDisciplina: attendance,
      dashboard,
    };

    // Índice de links por profesor
    INITIAL_LINKS = {};
    profesores.forEach(p => {
      if (p.link) INITIAL_LINKS[p.id] = p.link;
    });

    // Cargar pagos por separado
    try {
      const paymentsData = await api.getPayments();
      PAGOS_DATA = paymentsData.pagos || [];
    } catch { PAGOS_DATA = []; }

  } catch (e) {
    console.error('Error cargando datos admin:', e.message);
  }

  Object.assign(window, { PROFESORES_ADMIN, INSCRIPCIONES, EMPRESA, REPORTES, PAGOS_DATA, INITIAL_LINKS });
}

function maskToken(t) {
  if (!t) return '';
  return t.slice(0, 4) + '••••' + t.slice(-4);
}

Object.assign(window, {
  PROFESORES_ADMIN, INSCRIPCIONES, EMPRESA, REPORTES, PAGOS_DATA, INITIAL_LINKS,
  initAdminData, maskToken,
});
