const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/workshops  — talleres del profesor autenticado (admin ve todos)
router.get('/', requireAuth, (req, res) => {
  const { id: userId, rol } = req.user;

  const talleres = rol === 'admin'
    ? db.prepare('SELECT * FROM talleres ORDER BY nombre').all()
    : db.prepare('SELECT * FROM talleres WHERE profesor_id = ? ORDER BY nombre').all(userId);

  const tallersWithCount = talleres.map(t => {
    const { count } = db.prepare(
      'SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = ?'
    ).get(t.id);
    return { ...t, participantesCount: count };
  });

  res.json(tallersWithCount);
});

// GET /api/workshops/:id
router.get('/:id', requireAuth, (req, res) => {
  const taller = db.prepare('SELECT * FROM talleres WHERE id = ?').get(req.params.id);
  if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });

  const participantes = db.prepare(`
    SELECT p.* FROM participantes p
    JOIN taller_participantes tp ON tp.participante_id = p.id
    WHERE tp.taller_id = ?
    ORDER BY p.nombre
  `).all(req.params.id);

  res.json({ ...taller, participantes });
});

// GET /api/workshops/:id/payments  — pagos del taller (visible para el profesor)
router.get('/:id/payments', requireAuth, (req, res) => {
  const pagos = db.prepare(`
    SELECT pg.id, pg.concepto, pg.monto, pg.estado, pg.metodo, pg.fecha, pg.comprobante, pg.periodo,
           p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
    FROM pagos pg
    JOIN participantes p ON p.id = pg.participante_id
    WHERE pg.taller_id = ?
    ORDER BY p.nombre, pg.periodo DESC, pg.fecha DESC
  `).all(req.params.id);

  const inscritos = db.prepare(`
    SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
    FROM participantes p
    JOIN taller_participantes tp ON tp.participante_id = p.id
    WHERE tp.taller_id = ?
    ORDER BY p.nombre
  `).all(req.params.id);

  res.json({ pagos, inscritos });
});

// POST /api/workshops/:id/enroll
// Admin → inscripción directa confirmada
// Profesor → crea solicitud pendiente de aprobación admin
router.post('/:id/enroll', requireAuth, (req, res) => {
  const crypto = require('crypto');
  const { participante_id } = req.body;
  const { id: userId, rol } = req.user;
  if (!participante_id) return res.status(400).json({ error: 'participante_id requerido' });

  const taller = db.prepare('SELECT * FROM talleres WHERE id = ?').get(req.params.id);
  if (!taller) return res.status(404).json({ error: 'Taller no encontrado' });

  // Verificar duplicado en taller
  const yaEnTaller = db.prepare('SELECT 1 FROM taller_participantes WHERE taller_id = ? AND participante_id = ?').get(req.params.id, participante_id);
  if (yaEnTaller) return res.status(409).json({ error: 'El participante ya está inscrito en este taller' });

  if (rol === 'admin') {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM taller_participantes WHERE taller_id = ?').get(req.params.id);
    if (count >= taller.cupo) return res.status(409).json({ error: 'El taller está completo' });
    const inscId = 'i-' + crypto.randomBytes(4).toString('hex');
    db.prepare("INSERT OR IGNORE INTO inscripciones (id, participante_id, taller_id, estado) VALUES (?, ?, ?, 'confirmada')").run(inscId, participante_id, req.params.id);
    db.prepare('INSERT OR IGNORE INTO taller_participantes (taller_id, participante_id) VALUES (?, ?)').run(req.params.id, participante_id);
    res.json({ ok: true, estado: 'confirmada' });
  } else {
    // Verificar solicitud pendiente existente
    const pendiente = db.prepare("SELECT id FROM inscripciones WHERE taller_id = ? AND participante_id = ? AND estado = 'pendiente'").get(req.params.id, participante_id);
    if (pendiente) return res.status(409).json({ error: 'Ya existe una solicitud pendiente de aprobación para este alumno' });
    const inscId = 'i-' + crypto.randomBytes(4).toString('hex');
    db.prepare("INSERT INTO inscripciones (id, participante_id, taller_id, estado) VALUES (?, ?, ?, 'pendiente')").run(inscId, participante_id, req.params.id);
    res.json({ ok: true, estado: 'pendiente', mensaje: 'Solicitud enviada — pendiente de aprobación por administración' });
  }
});

// DELETE /api/workshops/:id/enroll/:participanteId
router.delete('/:id/enroll/:participanteId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM taller_participantes WHERE taller_id = ? AND participante_id = ?')
    .run(req.params.id, req.params.participanteId);
  res.json({ ok: true });
});

module.exports = router;
