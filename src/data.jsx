// ──────────────────────────────────────────────────────────────
// Datos — cargados desde la API, con fallback a valores vacíos
// ──────────────────────────────────────────────────────────────

// Estado global mutable (se puebla en initAppData)
let PROFESSOR = { id: '', nombre: '', email: '', avatarBg: 'oklch(82% 0.12 125)', iniciales: '', dni: '', desde: '' };
let WORKSHOPS = [];
let PARTICIPANTS_POOL = [];
let ATTENDANCE_HISTORY = {};

// Convierte un usuario de la API al formato que espera la UI
function mapUser(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    avatarBg: u.avatar_bg || 'oklch(82% 0.12 125)',
    iniciales: u.iniciales || u.nombre.slice(0, 2).toUpperCase(),
    dni: u.dni || '',
    desde: u.desde || '',
    rol: u.rol,
  };
}

// Convierte taller de la API al formato UI (agrega participantesIds)
function mapWorkshop(t, participantes = []) {
  return {
    id: t.id,
    nombre: t.nombre,
    disciplina: t.disciplina,
    emoji: t.emoji || '📋',
    horario: t.horario || '',
    hora: t.hora || '',
    cupo: t.cupo || 20,
    sede: t.sede || '',
    color: t.color || 'oklch(82% 0.12 200)',
    proxima: t.proxima || '',
    participantesIds: participantes.map(p => p.id),
    participantes,
  };
}

// Carga todos los datos del profesor desde la API
async function initAppData(userFromLogin) {
  try {
    const [meData, talleres] = await Promise.all([
      userFromLogin ? Promise.resolve(userFromLogin) : api.me(),
      api.getWorkshops(),
    ]);

    PROFESSOR = mapUser(meData);

    // Cargar participantes de cada taller
    const workshopsWithParts = await Promise.all(
      talleres.map(async (t) => {
        try {
          const full = await api.getWorkshop(t.id);
          return mapWorkshop(full, full.participantes || []);
        } catch {
          return mapWorkshop(t, []);
        }
      })
    );
    WORKSHOPS = workshopsWithParts;

    // Pool de participantes: unión de todos los talleres + todos los participantes disponibles
    try {
      const allParts = await api.get('/participants');
      PARTICIPANTS_POOL = allParts.map(p => ({
        id: p.id,
        nombre: p.nombre,
        edad: p.edad,
        estado: p.estado,
        iniciales: p.iniciales || p.nombre.slice(0, 2).toUpperCase(),
        bg: p.avatar_bg || 'oklch(82% 0.12 200)',
      }));
    } catch {
      // fallback: solo los del primer taller
      PARTICIPANTS_POOL = WORKSHOPS.flatMap(w => w.participantes).map(p => ({
        id: p.id, nombre: p.nombre, edad: p.edad, estado: p.estado,
        iniciales: p.iniciales, bg: p.avatar_bg,
      }));
    }

    // Precargar historial del primer taller
    try {
      const firstId = WORKSHOPS[0]?.id;
      if (firstId) {
        const hist = await api.getAttendanceHistory(firstId);
        ATTENDANCE_HISTORY[firstId] = hist;
      }
    } catch {}

  } catch (e) {
    console.error('Error cargando datos:', e.message);
  }

  Object.assign(window, { PROFESSOR, WORKSHOPS, PARTICIPANTS_POOL, ATTENDANCE_HISTORY });
}

// Cargar historial bajo demanda
async function ensureHistory(workshopId) {
  if (ATTENDANCE_HISTORY[workshopId]) return;
  try {
    ATTENDANCE_HISTORY[workshopId] = await api.getAttendanceHistory(workshopId);
  } catch { ATTENDANCE_HISTORY[workshopId] = []; }
}

function getParticipants(workshopId) {
  const w = WORKSHOPS.find(x => x.id === workshopId);
  if (!w) return [];
  if (w.participantes?.length) return w.participantes;
  return w.participantesIds.map(id => PARTICIPANTS_POOL.find(p => p.id === id)).filter(Boolean);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateES(iso) {
  const d = new Date(iso + 'T12:00:00');
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

Object.assign(window, {
  PROFESSOR, WORKSHOPS, PARTICIPANTS_POOL, ATTENDANCE_HISTORY,
  initAppData, ensureHistory, getParticipants, todayISO, formatDateES,
  mapUser, mapWorkshop,
});
