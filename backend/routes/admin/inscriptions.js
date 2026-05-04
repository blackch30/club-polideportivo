const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { estado, q } = req.query;
    const params = [];
    let sql = `
      SELECT i.*, p.nombre as socio, t.nombre as taller
      FROM inscripciones i
      JOIN participantes p ON p.id = i.participante_id
      JOIN talleres t ON t.id = i.taller_id
      WHERE 1=1
    `;

    if (estado && estado !== 'todos') { params.push(estado); sql += ` AND i.estado = $${params.length}`; }
    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.nombre ILIKE $${params.length} OR t.nombre ILIKE $${params.length})`;
    }

    sql += ' ORDER BY i.fecha DESC LIMIT 100';
    res.json(await query(sql, params));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { participante_id, taller_id, monto, metodo_pago } = req.body;
    if (!participante_id || !taller_id) return res.status(400).json({ error: 'participante_id y taller_id requeridos' });

    const id = 'i-' + crypto.randomBytes(4).toString('hex');
    await query(
      'INSERT INTO inscripciones (id, participante_id, taller_id, monto, metodo_pago) VALUES ($1, $2, $3, $4, $5)',
      [id, participante_id, taller_id, monto || null, metodo_pago || null]
    );
    await query(
      'INSERT INTO taller_participantes (taller_id, participante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [taller_id, participante_id]
    );

    const insc = await queryOne(`
      SELECT i.*, p.nombre as socio, t.nombre as taller
      FROM inscripciones i
      JOIN participantes p ON p.id = i.participante_id
      JOIN talleres t ON t.id = i.taller_id
      WHERE i.id = $1
    `, [id]);

    res.status(201).json(insc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { estado, monto, metodo_pago } = req.body;
    await query(`
      UPDATE inscripciones
      SET estado      = COALESCE($1, estado),
          monto       = COALESCE($2, monto),
          metodo_pago = COALESCE($3, metodo_pago)
      WHERE id = $4
    `, [estado || null, monto || null, metodo_pago || null, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const insc = await queryOne('SELECT * FROM inscripciones WHERE id = $1', [req.params.id]);
    if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' });
    const taller = await queryOne('SELECT * FROM talleres WHERE id = $1', [insc.taller_id]);
    const row = await queryOne('SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = $1', [insc.taller_id]);
    if (Number(row.count) >= taller.cupo) return res.status(409).json({ error: 'El taller está completo' });
    await query("UPDATE inscripciones SET estado = 'confirmada' WHERE id = $1", [req.params.id]);
    await query(
      'INSERT INTO taller_participantes (taller_id, participante_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [insc.taller_id, insc.participante_id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id/reject', requireAdmin, async (req, res) => {
  try {
    await query("UPDATE inscripciones SET estado = 'cancelada' WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM inscripciones WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
