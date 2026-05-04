const express = require('express');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    const talleres = rol === 'admin'
      ? await query('SELECT * FROM talleres ORDER BY nombre')
      : await query('SELECT * FROM talleres WHERE profesor_id = $1 ORDER BY nombre', [userId]);

    const tallersWithCount = await Promise.all(talleres.map(async t => {
      const row = await queryOne('SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = $1', [t.id]);
      return { ...t, participantesCount: Number(row.count) };
    }));

    res.json(tallersWithCount);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const taller = await queryOne('SELECT * FROM talleres WHERE id = $1', [req.params.id]);
    if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });

    const participantes = await query(`
      SELECT p.* FROM participantes p
      JOIN taller_participantes tp ON tp.participante_id = p.id
      WHERE tp.taller_id = $1
      ORDER BY p.nombre
    `, [req.params.id]);

    res.json({ ...taller, participantes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id/payments', requireAuth, async (req, res) => {
  try {
    const pagos = await query(`
      SELECT pg.id, pg.concepto, pg.monto, pg.estado, pg.metodo, pg.fecha, pg.comprobante, pg.periodo,
             p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
      FROM pagos pg
      JOIN participantes p ON p.id = pg.participante_id
      WHERE pg.taller_id = $1
      ORDER BY p.nombre, pg.periodo DESC, pg.fecha DESC
    `, [req.params.id]);

    const inscritos = await query(`
      SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
      FROM participantes p
      JOIN taller_participantes tp ON tp.participante_id = p.id
      WHERE tp.taller_id = $1
      ORDER BY p.nombre
    `, [req.params.id]);

    res.json({ pagos, inscritos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/:id/enroll', requireAuth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { participante_id } = req.body;
    const { id: userId, rol } = req.user;
    if (!participante_id) return res.status(400).json({ error: 'participante_id requerido' });

    const taller = await queryOne('SELECT * FROM talleres WHERE id = $1', [req.params.id]);
    if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });

    const yaEnTaller = await queryOne(
      'SELECT 1 FROM taller_participantes WHERE taller_id = $1 AND participante_id = $2',
      [req.params.id, participante_id]
    );
    if (yaEnTaller) return res.status(409).json({ error: 'El participante ya está inscrito en este taller' });

    if (rol === 'admin') {
      const row = await queryOne('SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = $1', [req.params.id]);
      if (Number(row.count) >= taller.cupo) return res.status(409).json({ error: 'El taller está completo' });
      const inscId = 'i-' + crypto.randomBytes(4).toString('hex');
      await query(
        "INSERT INTO inscripciones (id, participante_id, taller_id, estado) VALUES ($1, $2, $3, 'confirmada') ON CONFLICT DO NOTHING",
        [inscId, participante_id, req.params.id]
      );
      await query(
        'INSERT INTO taller_participantes (taller_id, participante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.params.id, participante_id]
      );
      res.json({ ok: true, estado: 'confirmada' });
    } else {
      const pendiente = await queryOne(
        "SELECT id FROM inscripciones WHERE taller_id = $1 AND participante_id = $2 AND estado = 'pendiente'",
        [req.params.id, participante_id]
      );
      if (pendiente) return res.status(409).json({ error: 'Ya existe una solicitud pendiente de aprobación para este alumno' });
      const inscId = 'i-' + crypto.randomBytes(4).toString('hex');
      await query(
        "INSERT INTO inscripciones (id, participante_id, taller_id, estado) VALUES ($1, $2, $3, 'pendiente')",
        [inscId, participante_id, req.params.id]
      );
      res.json({ ok: true, estado: 'pendiente', mensaje: 'Solicitud enviada — pendiente de aprobación por administración' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id/enroll/:participanteId', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM taller_participantes WHERE taller_id = $1 AND participante_id = $2',
      [req.params.id, req.params.participanteId]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
