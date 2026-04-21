const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance/:workshopId/participants  — asistencia individual por alumno
router.get('/:workshopId/participants', requireAuth, (req, res) => {
  const { workshopId } = req.params;

  const inscritos = db.prepare(`
    SELECT p.id, p.nombre, p.iniciales, p.avatar_bg
    FROM participantes p
    JOIN taller_participantes tp ON tp.participante_id = p.id
    WHERE tp.taller_id = ?
    ORDER BY p.nombre
  `).all(workshopId);

  const result = inscritos.map(p => {
    const rows = db.prepare(`
      SELECT fecha, estado FROM asistencias
      WHERE taller_id = ? AND participante_id = ?
      ORDER BY fecha DESC LIMIT 30
    `).all(workshopId, p.id);
    const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;
    const ausentes  = rows.filter(r => r.estado === 'absent').length;
    return {
      ...p, presentes, ausentes, total: rows.length,
      pct: rows.length > 0 ? Math.round((presentes / rows.length) * 100) : null,
      fechas: rows,
    };
  });
  res.json(result);
});

// GET /api/attendance/:workshopId?fecha=YYYY-MM-DD
router.get('/:workshopId', requireAuth, (req, res) => {
  const { workshopId } = req.params;
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

  const registros = db.prepare(`
    SELECT participante_id, estado FROM asistencias
    WHERE taller_id = ? AND fecha = ?
  `).all(workshopId, fecha);

  const attendanceMap = {};
  registros.forEach(r => { attendanceMap[r.participante_id] = r.estado; });

  res.json({ fecha, attendance: attendanceMap });
});

// GET /api/attendance/:workshopId/history
router.get('/:workshopId/history', requireAuth, (req, res) => {
  const { workshopId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const fechas = db.prepare(`
    SELECT fecha FROM asistencias
    WHERE taller_id = ?
    GROUP BY fecha
    ORDER BY fecha DESC
    LIMIT ?
  `).all(workshopId, limit).map(r => r.fecha);

  const history = fechas.map(fecha => {
    const rows = db.prepare(
      'SELECT estado FROM asistencias WHERE taller_id = ? AND fecha = ?'
    ).all(workshopId, fecha);
    const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;
    const ausentes  = rows.filter(r => r.estado === 'absent').length;
    return { fecha, presentes, ausentes, total: rows.length };
  });

  res.json(history);
});

// POST /api/attendance  — guardar asistencia del día
router.post('/', requireAuth, (req, res) => {
  const { workshopId, fecha, attendance } = req.body;

  if (!workshopId || !fecha || !attendance) {
    return res.status(400).json({ error: 'workshopId, fecha y attendance son requeridos' });
  }

  const upsert = db.prepare(`
    INSERT INTO asistencias (taller_id, participante_id, fecha, estado)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(taller_id, participante_id, fecha) DO UPDATE SET estado = excluded.estado
  `);

  const saveAll = db.transaction((map) => {
    for (const [participanteId, estado] of Object.entries(map)) {
      upsert.run(workshopId, participanteId, fecha, estado);
    }
  });

  saveAll(attendance);

  const rows = db.prepare(
    'SELECT estado FROM asistencias WHERE taller_id = ? AND fecha = ?'
  ).all(workshopId, fecha);
  const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;

  res.json({ ok: true, presentes, total: rows.length });
});

module.exports = router;
