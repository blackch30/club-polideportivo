const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/available', requireAuth, async (req, res) => {
  try {
    const { workshopId } = req.query;
    if (!workshopId) return res.status(400).json({ error: 'workshopId requerido' });

    const participants = await query(`
      SELECT * FROM participantes
      WHERE id NOT IN (
        SELECT participante_id FROM taller_participantes WHERE taller_id = $1
      )
      ORDER BY nombre
    `, [workshopId]);

    res.json(participants);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { workshopId, q } = req.query;

    if (workshopId) {
      const participants = await query(`
        SELECT p.* FROM participantes p
        JOIN taller_participantes tp ON tp.participante_id = p.id
        WHERE tp.taller_id = $1
        ORDER BY p.nombre
      `, [workshopId]);
      return res.json(participants);
    }

    if (q) {
      const participants = await query(`
        SELECT * FROM participantes
        WHERE nombre ILIKE $1 OR iniciales ILIKE $1
        ORDER BY nombre
        LIMIT 20
      `, [`%${q}%`]);
      return res.json(participants);
    }

    const participants = await query('SELECT * FROM participantes ORDER BY nombre');
    res.json(participants);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { nombre, edad, contacto, apoderado_nombre, apoderado_telefono, apoderado_email } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });

    const id = 'u-' + crypto.randomBytes(4).toString('hex');
    const nombreTrim = nombre.trim();
    const partes = nombreTrim.split(' ');
    const iniciales = partes.length >= 2
      ? partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
      : nombreTrim.slice(0, 2).toUpperCase();

    const hue = Math.floor(Math.random() * 360);
    const avatar_bg = `oklch(82% 0.12 ${hue})`;

    await query(
      "INSERT INTO participantes (id, nombre, edad, estado, iniciales, avatar_bg, contacto, apoderado_nombre, apoderado_telefono, apoderado_email) VALUES ($1, $2, $3, 'activo', $4, $5, $6, $7, $8, $9)",
      [id, nombreTrim, edad ? Number(edad) : null, iniciales, avatar_bg, contacto || null, apoderado_nombre || null, apoderado_telefono || null, apoderado_email || null]
    );

    const participant = await queryOne('SELECT * FROM participantes WHERE id = $1', [id]);
    res.status(201).json(participant);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const p = await queryOne('SELECT * FROM participantes WHERE id = $1', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Participante no encontrado' });
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nombre, edad, contacto, estado, apoderado_nombre, apoderado_telefono, apoderado_email } = req.body;
    await query(`
      UPDATE participantes
      SET nombre             = COALESCE($1, nombre),
          edad               = COALESCE($2, edad),
          contacto           = COALESCE($3, contacto),
          estado             = COALESCE($4, estado),
          apoderado_nombre   = COALESCE($5, apoderado_nombre),
          apoderado_telefono = COALESCE($6, apoderado_telefono),
          apoderado_email    = COALESCE($7, apoderado_email)
      WHERE id = $8
    `, [nombre || null, edad ? Number(edad) : null, contacto || null, estado || null, apoderado_nombre || null, apoderado_telefono || null, apoderado_email || null, req.params.id]);
    const p = await queryOne('SELECT * FROM participantes WHERE id = $1', [req.params.id]);
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM participantes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
