const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/professors
router.get('/', requireAdmin, (req, res) => {
  const professors = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.dni, u.telefono, u.estado, u.desde, u.iniciales, u.avatar_bg,
           (SELECT COUNT(*) FROM talleres WHERE profesor_id = u.id) as talleres
    FROM users u WHERE u.rol = 'profesor'
    ORDER BY u.nombre
  `).all();

  const result = professors.map(p => {
    const disciplinas = db.prepare(
      'SELECT disciplina FROM profesor_disciplinas WHERE profesor_id = ?'
    ).all(p.id).map(d => d.disciplina);

    const link = db.prepare(`
      SELECT token, created_at, expires_at, used_at, usos, activo, permanent
      FROM magic_links WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(p.id);

    return { ...p, disciplinas, link: link || null };
  });

  res.json(result);
});

// POST /api/admin/professors
router.post('/', requireAdmin, (req, res) => {
  const { nombre, email, dni, telefono, disciplinas = [], desde } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: 'nombre y email requeridos' });

  const id = 'p-' + crypto.randomBytes(4).toString('hex');
  const partes = nombre.trim().split(' ');
  const iniciales = partes.length >= 2
    ? partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
    : nombre.slice(0, 2).toUpperCase();
  const hue = Math.floor(Math.random() * 360);
  const defaultPassword = bcrypt.hashSync('clubpoli2026', 10);

  try {
    db.prepare(`
      INSERT INTO users (id, nombre, email, password_hash, rol, dni, telefono, estado, desde, iniciales, avatar_bg)
      VALUES (?, ?, ?, ?, 'profesor', ?, ?, 'pendiente', ?, ?, ?)
    `).run(id, nombre.trim(), email.toLowerCase(), defaultPassword,
           dni || null, telefono || null, desde || String(new Date().getFullYear()),
           iniciales, `oklch(82% 0.12 ${hue})`);

    const insertDisc = db.prepare('INSERT OR IGNORE INTO profesor_disciplinas (profesor_id, disciplina) VALUES (?, ?)');
    disciplinas.forEach(d => insertDisc.run(id, d));

    const user = db.prepare('SELECT id, nombre, email, rol, estado, iniciales, avatar_bg FROM users WHERE id = ?').get(id);
    res.status(201).json({ ...user, disciplinas, talleres: 0, link: null });
  } catch {
    res.status(409).json({ error: 'El email ya está registrado' });
  }
});

// PUT /api/admin/professors/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { nombre, email, dni, telefono, estado, disciplinas } = req.body;

  db.prepare(`
    UPDATE users SET nombre = COALESCE(?, nombre), email = COALESCE(?, email),
      dni = COALESCE(?, dni), telefono = COALESCE(?, telefono), estado = COALESCE(?, estado)
    WHERE id = ?
  `).run(nombre || null, email ? email.toLowerCase() : null, dni || null, telefono || null, estado || null, req.params.id);

  if (Array.isArray(disciplinas)) {
    db.prepare('DELETE FROM profesor_disciplinas WHERE profesor_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT OR IGNORE INTO profesor_disciplinas (profesor_id, disciplina) VALUES (?, ?)');
    disciplinas.forEach(d => ins.run(req.params.id, d));
  }

  res.json({ ok: true });
});

// DELETE /api/admin/professors/:id
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ? AND rol = "profesor"').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/professors/:id/magic-link  — generar magic link (temporal o permanente)
router.post('/:id/magic-link', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Profesor no encontrado' });

  const permanent = req.body.permanent ? 1 : 0;
  const dias = req.body.dias || 7;

  db.prepare("UPDATE magic_links SET activo = 0 WHERE user_id = ?").run(req.params.id);

  const token = 'tkn_' + crypto.randomBytes(8).toString('hex');
  const expiresAt = permanent
    ? '2099-12-31T23:59:59.000Z'
    : new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO magic_links (token, user_id, expires_at, activo, permanent)
    VALUES (?, ?, ?, 1, ?)
  `).run(token, req.params.id, expiresAt, permanent);

  const url = `${process.env.APP_URL}/api/auth/magic-link/${token}`;
  console.log(`\n🔗 Magic link ${permanent ? 'PERMANENTE' : `(${dias}d)`} para ${user.email}:\n   ${url}\n`);

  res.json({ token, url, expires_at: expiresAt, permanent: !!permanent });
});

// DELETE /api/admin/professors/:id/magic-link  — revocar
router.delete('/:id/magic-link', requireAdmin, (req, res) => {
  db.prepare("UPDATE magic_links SET activo = 0 WHERE user_id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
