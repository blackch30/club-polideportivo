const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const talleres = await query(`
      SELECT t.*,
        u.nombre as profesor_nombre,
        (SELECT COUNT(*) FROM taller_participantes tp WHERE tp.taller_id = t.id) as inscritos
      FROM talleres t
      LEFT JOIN users u ON u.id = t.profesor_id
      ORDER BY t.nombre
    `);
    res.json(talleres.map(t => ({ ...t, inscritos: Number(t.inscritos) })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id } = req.body;
    if (!nombre || !disciplina) return res.status(400).json({ error: 'nombre y disciplina requeridos' });

    const id = 't-' + crypto.randomBytes(4).toString('hex');
    await query(`
      INSERT INTO talleres (id, nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [id, nombre, disciplina, emoji || '🏃', horario || null, hora || null,
        cupo || 20, sede || null, color || null, profesor_id || null]);

    const taller = await queryOne(`
      SELECT t.*, u.nombre as profesor_nombre,
        (SELECT COUNT(*) FROM taller_participantes tp WHERE tp.taller_id = t.id) as inscritos
      FROM talleres t LEFT JOIN users u ON u.id = t.profesor_id WHERE t.id = $1
    `, [id]);
    res.status(201).json({ ...taller, inscritos: Number(taller.inscritos) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id } = req.body;
    await query(`
      UPDATE talleres SET
        nombre      = COALESCE($1, nombre),
        disciplina  = COALESCE($2, disciplina),
        emoji       = COALESCE($3, emoji),
        horario     = COALESCE($4, horario),
        hora        = COALESCE($5, hora),
        cupo        = COALESCE($6, cupo),
        sede        = COALESCE($7, sede),
        color       = COALESCE($8, color),
        profesor_id = $9
      WHERE id = $10
    `, [nombre||null, disciplina||null, emoji||null, horario||null,
        hora||null, cupo||null, sede||null, color||null,
        profesor_id||null, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM talleres WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id/inscriptions', requireAdmin, async (req, res) => {
  try {
    const inscritos = await query(`
      SELECT i.id as inscripcion_id, i.estado, i.monto, i.metodo_pago, i.fecha,
             p.id as participante_id, p.nombre, p.edad, p.iniciales, p.avatar_bg, p.contacto
      FROM inscripciones i
      JOIN participantes p ON p.id = i.participante_id
      WHERE i.taller_id = $1
      ORDER BY p.nombre
    `, [req.params.id]);
    res.json(inscritos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/:id/inscriptions', requireAdmin, async (req, res) => {
  try {
    const { participante_id, monto, metodo_pago } = req.body;
    if (!participante_id) return res.status(400).json({ error: 'participante_id requerido' });

    const existing = await queryOne(
      'SELECT id FROM inscripciones WHERE taller_id = $1 AND participante_id = $2',
      [req.params.id, participante_id]
    );
    if (existing) return res.status(409).json({ error: 'El participante ya está inscripto en este taller' });

    const id = 'i-' + crypto.randomBytes(4).toString('hex');
    await query(
      'INSERT INTO inscripciones (id, participante_id, taller_id, monto, metodo_pago) VALUES ($1, $2, $3, $4, $5)',
      [id, participante_id, req.params.id, monto || null, metodo_pago || null]
    );
    await query(
      'INSERT INTO taller_participantes (taller_id, participante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, participante_id]
    );

    const insc = await queryOne(`
      SELECT i.id as inscripcion_id, i.estado, i.monto, i.metodo_pago, i.fecha,
             p.id as participante_id, p.nombre, p.edad, p.iniciales, p.avatar_bg, p.contacto
      FROM inscripciones i
      JOIN participantes p ON p.id = i.participante_id
      WHERE i.id = $1
    `, [id]);
    res.status(201).json(insc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id/inscriptions/:inscripcionId', requireAdmin, async (req, res) => {
  try {
    const insc = await queryOne('SELECT * FROM inscripciones WHERE id = $1', [req.params.inscripcionId]);
    if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' });

    await query('DELETE FROM inscripciones WHERE id = $1', [req.params.inscripcionId]);
    await query('DELETE FROM taller_participantes WHERE taller_id = $1 AND participante_id = $2',
      [req.params.id, insc.participante_id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id/payments', requireAdmin, async (req, res) => {
  try {
    const pagos = await query(`
      SELECT pg.id, pg.concepto, pg.monto, pg.estado, pg.metodo, pg.fecha, pg.comprobante, pg.periodo,
             p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
      FROM pagos pg
      JOIN participantes p ON p.id = pg.participante_id
      WHERE pg.taller_id = $1
      ORDER BY p.nombre, pg.periodo DESC, pg.fecha DESC
    `, [req.params.id]);

    const sinPago = await query(`
      SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
      FROM participantes p
      JOIN inscripciones i ON i.participante_id = p.id
      WHERE i.taller_id = $1
        AND p.id NOT IN (SELECT participante_id FROM pagos WHERE taller_id = $1 AND participante_id IS NOT NULL)
    `, [req.params.id]);

    res.json({ pagos, sinPago });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id/available', requireAdmin, async (req, res) => {
  try {
    const disponibles = await query(`
      SELECT id, nombre, edad, iniciales, avatar_bg
      FROM participantes
      WHERE id NOT IN (SELECT participante_id FROM taller_participantes WHERE taller_id = $1)
      AND estado = 'activo'
      ORDER BY nombre
    `, [req.params.id]);
    res.json(disponibles);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
