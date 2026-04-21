const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/participants?workshopId=&q=
router.get('/', requireAuth, (req, res) => {
  const { workshopId, q } = req.query;

  if (workshopId) {
    const participants = db.prepare(`
      SELECT p.* FROM participantes p
      JOIN taller_participantes tp ON tp.participante_id = p.id
      WHERE tp.taller_id = ?
      ORDER BY p.nombre
    `).all(workshopId);
    return res.json(participants);
  }

  if (q) {
    const participants = db.prepare(`
      SELECT * FROM participantes
      WHERE nombre LIKE ? OR iniciales LIKE ?
      ORDER BY nombre
      LIMIT 20
    `).all(`%${q}%`, `%${q}%`);
    return res.json(participants);
  }

  const participants = db.prepare('SELECT * FROM participantes ORDER BY nombre').all();
  res.json(participants);
});

// GET /api/participants/available?workshopId=  — socios NO inscritos en ese taller
router.get('/available', requireAuth, (req, res) => {
  const { workshopId } = req.query;
  if (!workshopId) return res.status(400).json({ error: 'workshopId requerido' });

  const participants = db.prepare(`
    SELECT * FROM participantes
    WHERE id NOT IN (
      SELECT participante_id FROM taller_participantes WHERE taller_id = ?
    )
    ORDER BY nombre
  `).all(workshopId);

  res.json(participants);
});

// POST /api/participants  — registrar nuevo participante
router.post('/', requireAuth, (req, res) => {
  const { nombre, edad, contacto } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });

  const id = 'u-' + crypto.randomBytes(4).toString('hex');
  const nombreTrim = nombre.trim();
  const partes = nombreTrim.split(' ');
  const iniciales = partes.length >= 2
    ? partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
    : nombreTrim.slice(0, 2).toUpperCase();

  const hue = Math.floor(Math.random() * 360);
  const avatar_bg = `oklch(82% 0.12 ${hue})`;

  db.prepare(`
    INSERT INTO participantes (id, nombre, edad, estado, iniciales, avatar_bg, contacto)
    VALUES (?, ?, ?, 'activo', ?, ?, ?)
  `).run(id, nombreTrim, edad ? Number(edad) : null, iniciales, avatar_bg, contacto || null);

  const participant = db.prepare('SELECT * FROM participantes WHERE id = ?').get(id);
  res.status(201).json(participant);
});

// GET /api/participants/:id
router.get('/:id', requireAuth, (req, res) => {
  const p = db.prepare('SELECT * FROM participantes WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Participante no encontrado' });
  res.json(p);
});

// PUT /api/participants/:id
router.put('/:id', requireAuth, (req, res) => {
  const { nombre, edad, contacto, estado } = req.body;
  db.prepare(`
    UPDATE participantes
    SET nombre = COALESCE(?, nombre), edad = COALESCE(?, edad),
        contacto = COALESCE(?, contacto), estado = COALESCE(?, estado)
    WHERE id = ?
  `).run(nombre || null, edad ? Number(edad) : null, contacto || null, estado || null, req.params.id);
  const p = db.prepare('SELECT * FROM participantes WHERE id = ?').get(req.params.id);
  res.json(p);
});

// DELETE /api/participants/:id
router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM participantes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
