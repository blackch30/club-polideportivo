const express = require('express');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/reports/dashboard  — KPIs principales
router.get('/dashboard', requireAdmin, (req, res) => {
  const alumnosActivos = db.prepare(
    "SELECT COUNT(*) as c FROM participantes WHERE estado = 'activo'"
  ).get().c;

  const totalTalleres = db.prepare('SELECT COUNT(*) as c FROM talleres').get().c;

  const ingresosMes = db.prepare(`
    SELECT COALESCE(SUM(monto), 0) as total FROM pagos
    WHERE estado = 'pagado' AND strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
  `).get().total;

  const asistenciaProm = db.prepare(`
    SELECT ROUND(100.0 * SUM(CASE WHEN estado IN ('present','late') THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 0) as pct
    FROM asistencias
    WHERE fecha >= date('now', '-30 days')
  `).get().pct || 0;

  // Links activos en este momento
  const linksActivos = db.prepare(
    "SELECT COUNT(*) as c FROM magic_links WHERE activo = 1 AND expires_at > datetime('now')"
  ).get().c;

  res.json({ alumnosActivos, totalTalleres, ingresosMes, asistenciaProm, linksActivos });
});

// GET /api/admin/reports/attendance  — asistencia por disciplina
router.get('/attendance', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT t.disciplina, t.nombre,
      COUNT(a.id) as total,
      SUM(CASE WHEN a.estado IN ('present','late') THEN 1 ELSE 0 END) as presentes,
      COUNT(DISTINCT tp.participante_id) as alumnos
    FROM talleres t
    LEFT JOIN asistencias a ON a.taller_id = t.id
    LEFT JOIN taller_participantes tp ON tp.taller_id = t.id
    GROUP BY t.id
    ORDER BY t.disciplina
  `).all();

  const result = rows.map(r => ({
    nombre: r.disciplina,
    pct: r.total > 0 ? Math.round((r.presentes / r.total) * 100) : 0,
    alumnos: r.alumnos,
  }));

  res.json(result);
});

// GET /api/admin/reports/revenue?months=12  — ingresos por mes
router.get('/revenue', requireAdmin, (req, res) => {
  const months = Math.min(Number(req.query.months) || 12, 24);

  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fecha) as mes, COALESCE(SUM(monto), 0) as total
    FROM pagos WHERE estado = 'pagado'
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT ?
  `).all(months).reverse();

  res.json(rows);
});

// GET /api/admin/reports/inscriptions?months=12
router.get('/inscriptions', requireAdmin, (req, res) => {
  const months = Math.min(Number(req.query.months) || 12, 24);

  const rows = db.prepare(`
    SELECT strftime('%Y-%m', fecha) as mes, COUNT(*) as total
    FROM inscripciones
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT ?
  `).all(months).reverse();

  res.json(rows);
});

module.exports = router;
