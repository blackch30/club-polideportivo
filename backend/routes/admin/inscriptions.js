const express = require('express');
const crypto = require('crypto');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/inscriptions?estado=&q=
router.get('/', requireAdmin, (req, res) => {
  const { estado, q } = req.query;

  let sql = `
    SELECT i.*, p.nombre as socio, t.nombre as taller
    FROM inscripciones i
    JOIN participantes p ON p.id = i.participante_id
    JOIN talleres t ON t.id = i.taller_id
    WHERE 1=1
  `;
  const params = [];

  if (estado && estado !== 'todos') { sql += ' AND i.estado = ?'; params.push(estado); }
  if (q) { sql += ' AND (p.nombre LIKE ? OR t.nombre LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

  sql += ' ORDER BY i.fecha DESC LIMIT 100';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/admin/inscriptions
router.post('/', requireAdmin, (req, res) => {
  const { participante_id, taller_id, monto, metodo_pago } = req.body;
  if (!participante_id || !taller_id) {
    return res.status(400).json({ error: 'participante_id y taller_id requeridos' });
  }

  const id = 'i-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO inscripciones (id, participante_id, taller_id, monto, metodo_pago)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, participante_id, taller_id, monto || null, metodo_pago || null);

  // También agregar al taller
  db.prepare('INSERT OR IGNORE INTO taller_participantes (taller_id, participante_id) VALUES (?, ?)')
    .run(taller_id, participante_id);

  const insc = db.prepare(`
    SELECT i.*, p.nombre as socio, t.nombre as taller
    FROM inscripciones i
    JOIN participantes p ON p.id = i.participante_id
    JOIN talleres t ON t.id = i.taller_id
    WHERE i.id = ?
  `).get(id);

  res.status(201).json(insc);
});

// PUT /api/admin/inscriptions/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { estado, monto, metodo_pago } = req.body;
  db.prepare(`
    UPDATE inscripciones
    SET estado = COALESCE(?, estado), monto = COALESCE(?, monto), metodo_pago = COALESCE(?, metodo_pago)
    WHERE id = ?
  `).run(estado || null, monto || null, metodo_pago || null, req.params.id);
  res.json({ ok: true });
});

// PUT /api/admin/inscriptions/:id/approve — aprobar solicitud pendiente
router.put('/:id/approve', requireAdmin, (req, res) => {
  const insc = db.prepare('SELECT * FROM inscripciones WHERE id = ?').get(req.params.id);
  if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' });
  const taller = db.prepare('SELECT * FROM talleres WHERE id = ?').get(insc.taller_id);
  const { count } = db.prepare('SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = ?').get(insc.taller_id);
  if (count >= taller.cupo) return res.status(409).json({ error: 'El taller está completo' });
  db.prepare("UPDATE inscripciones SET estado = 'confirmada' WHERE id = ?").run(req.params.id);
  db.prepare('INSERT OR IGNORE INTO taller_participantes (taller_id, participante_id) VALUES (?, ?)').run(insc.taller_id, insc.participante_id);
  res.json({ ok: true });
});

// PUT /api/admin/inscriptions/:id/reject — rechazar solicitud
router.put('/:id/reject', requireAdmin, (req, res) => {
  db.prepare("UPDATE inscripciones SET estado = 'cancelada' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/inscriptions/:id
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM inscripciones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
