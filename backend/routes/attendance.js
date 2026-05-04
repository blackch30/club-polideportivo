const express = require('express');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:workshopId/participants', requireAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const inscritos = await query(`
      SELECT p.id, p.nombre, p.iniciales, p.avatar_bg
      FROM participantes p
      JOIN taller_participantes tp ON tp.participante_id = p.id
      WHERE tp.taller_id = $1
      ORDER BY p.nombre
    `, [workshopId]);

    const result = await Promise.all(inscritos.map(async p => {
      const rows = await query(`
        SELECT fecha, estado FROM asistencias
        WHERE taller_id = $1 AND participante_id = $2
        ORDER BY fecha DESC LIMIT 30
      `, [workshopId, p.id]);
      const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;
      const ausentes  = rows.filter(r => r.estado === 'absent').length;
      return {
        ...p, presentes, ausentes, total: rows.length,
        pct: rows.length > 0 ? Math.round((presentes / rows.length) * 100) : null,
        fechas: rows,
      };
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:workshopId/history', requireAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const fechasRows = await query(`
      SELECT fecha FROM asistencias
      WHERE taller_id = $1
      GROUP BY fecha
      ORDER BY fecha DESC
      LIMIT $2
    `, [workshopId, limit]);

    const history = await Promise.all(fechasRows.map(async ({ fecha }) => {
      const rows = await query(
        'SELECT estado FROM asistencias WHERE taller_id = $1 AND fecha = $2',
        [workshopId, fecha]
      );
      const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;
      const ausentes  = rows.filter(r => r.estado === 'absent').length;
      return { fecha, presentes, ausentes, total: rows.length };
    }));

    res.json(history);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:workshopId', requireAuth, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

    const registros = await query(
      'SELECT participante_id, estado FROM asistencias WHERE taller_id = $1 AND fecha = $2',
      [workshopId, fecha]
    );

    const attendanceMap = {};
    registros.forEach(r => { attendanceMap[r.participante_id] = r.estado; });

    res.json({ fecha, attendance: attendanceMap });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { workshopId, fecha, attendance } = req.body;
    if (!workshopId || !fecha || !attendance) {
      return res.status(400).json({ error: 'workshopId, fecha y attendance son requeridos' });
    }

    const client = require('../db').pool;
    const conn = await client.connect();
    try {
      await conn.query('BEGIN');
      for (const [participanteId, estado] of Object.entries(attendance)) {
        await conn.query(`
          INSERT INTO asistencias (taller_id, participante_id, fecha, estado)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (taller_id, participante_id, fecha) DO UPDATE SET estado = EXCLUDED.estado
        `, [workshopId, participanteId, fecha, estado]);
      }
      await conn.query('COMMIT');
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }

    const rows = await query(
      'SELECT estado FROM asistencias WHERE taller_id = $1 AND fecha = $2',
      [workshopId, fecha]
    );
    const presentes = rows.filter(r => r.estado === 'present' || r.estado === 'late').length;

    res.json({ ok: true, presentes, total: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
