const express = require('express');
const crypto = require('crypto');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/workshops
router.get('/', requireAdmin, (req, res) => {
  const talleres = db.prepare(`
    SELECT t.*,
      u.nombre as profesor_nombre,
      (SELECT COUNT(*) FROM taller_participantes tp WHERE tp.taller_id = t.id) as inscritos
    FROM talleres t
    LEFT JOIN users u ON u.id = t.profesor_id
    ORDER BY t.nombre
  `).all();
  res.json(talleres);
});

// POST /api/admin/workshops
router.post('/', requireAdmin, (req, res) => {
  const { nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id } = req.body;
  if (!nombre || !disciplina) return res.status(400).json({ error: 'nombre y disciplina requeridos' });

  const id = 't-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO talleres (id, nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nombre, disciplina, emoji || '🏃', horario || null, hora || null,
         cupo || 20, sede || null, color || null, profesor_id || null);

  const taller = db.prepare(`
    SELECT t.*, u.nombre as profesor_nombre,
      (SELECT COUNT(*) FROM taller_participantes tp WHERE tp.taller_id = t.id) as inscritos
    FROM talleres t LEFT JOIN users u ON u.id = t.profesor_id WHERE t.id = ?
  `).get(id);
  res.status(201).json(taller);
});

// PUT /api/admin/workshops/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { nombre, disciplina, emoji, horario, hora, cupo, sede, color, profesor_id } = req.body;
  db.prepare(`
    UPDATE talleres SET
      nombre = COALESCE(?, nombre), disciplina = COALESCE(?, disciplina),
      emoji = COALESCE(?, emoji), horario = COALESCE(?, horario),
      hora = COALESCE(?, hora), cupo = COALESCE(?, cupo),
      sede = COALESCE(?, sede), color = COALESCE(?, color),
      profesor_id = ?
    WHERE id = ?
  `).run(nombre||null, disciplina||null, emoji||null, horario||null,
         hora||null, cupo||null, sede||null, color||null,
         profesor_id||null, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/workshops/:id
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM talleres WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/workshops/:id/inscriptions
router.get('/:id/inscriptions', requireAdmin, (req, res) => {
  const inscritos = db.prepare(`
    SELECT i.id as inscripcion_id, i.estado, i.monto, i.metodo_pago, i.fecha,
           p.id as participante_id, p.nombre, p.edad, p.iniciales, p.avatar_bg, p.contacto
    FROM inscripciones i
    JOIN participantes p ON p.id = i.participante_id
    WHERE i.taller_id = ?
    ORDER BY p.nombre
  `).all(req.params.id);
  res.json(inscritos);
});

// POST /api/admin/workshops/:id/inscriptions
router.post('/:id/inscriptions', requireAdmin, (req, res) => {
  const { participante_id, monto, metodo_pago } = req.body;
  if (!participante_id) return res.status(400).json({ error: 'participante_id requerido' });

  const existing = db.prepare(
    'SELECT id FROM inscripciones WHERE taller_id = ? AND participante_id = ?'
  ).get(req.params.id, participante_id);
  if (existing) return res.status(409).json({ error: 'El participante ya está inscripto en este taller' });

  const id = 'i-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO inscripciones (id, participante_id, taller_id, monto, metodo_pago)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, participante_id, req.params.id, monto || null, metodo_pago || null);

  db.prepare('INSERT OR IGNORE INTO taller_participantes (taller_id, participante_id) VALUES (?, ?)')
    .run(req.params.id, participante_id);

  const insc = db.prepare(`
    SELECT i.id as inscripcion_id, i.estado, i.monto, i.metodo_pago, i.fecha,
           p.id as participante_id, p.nombre, p.edad, p.iniciales, p.avatar_bg, p.contacto
    FROM inscripciones i
    JOIN participantes p ON p.id = i.participante_id
    WHERE i.id = ?
  `).get(id);
  res.status(201).json(insc);
});

// DELETE /api/admin/workshops/:id/inscriptions/:inscripcionId
router.delete('/:id/inscriptions/:inscripcionId', requireAdmin, (req, res) => {
  const insc = db.prepare('SELECT * FROM inscripciones WHERE id = ?').get(req.params.inscripcionId);
  if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' });

  db.prepare('DELETE FROM inscripciones WHERE id = ?').run(req.params.inscripcionId);
  db.prepare('DELETE FROM taller_participantes WHERE taller_id = ? AND participante_id = ?')
    .run(req.params.id, insc.participante_id);
  res.json({ ok: true });
});

// GET /api/admin/workshops/:id/payments
router.get('/:id/payments', requireAdmin, (req, res) => {
  const pagos = db.prepare(`
    SELECT pg.id, pg.concepto, pg.monto, pg.estado, pg.metodo, pg.fecha, pg.comprobante, pg.periodo,
           p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
    FROM pagos pg
    JOIN participantes p ON p.id = pg.participante_id
    WHERE pg.taller_id = ?
    ORDER BY p.nombre, pg.periodo DESC, pg.fecha DESC
  `).all(req.params.id);

  const sinPago = db.prepare(`
    SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
    FROM participantes p
    JOIN inscripciones i ON i.participante_id = p.id
    WHERE i.taller_id = ?
      AND p.id NOT IN (SELECT participante_id FROM pagos WHERE taller_id = ? AND participante_id IS NOT NULL)
  `).all(req.params.id, req.params.id);

  res.json({ pagos, sinPago });
});

// GET /api/admin/workshops/:id/available  — participantes NO inscritos en este taller
router.get('/:id/available', requireAdmin, (req, res) => {
  const disponibles = db.prepare(`
    SELECT id, nombre, edad, iniciales, avatar_bg
    FROM participantes
    WHERE id NOT IN (SELECT participante_id FROM taller_participantes WHERE taller_id = ?)
    AND estado = 'activo'
    ORDER BY nombre
  `).all(req.params.id);
  res.json(disponibles);
});

module.exports = router;
