const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  if (user.estado === 'inactivo') {
    return res.status(403).json({ error: 'Cuenta inactiva. Contacte a administración.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/magic-link  — genera token y "envía" email (lo imprime si no hay SMTP)
router.post('/magic-link', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  // Siempre responde OK para no revelar si el email existe
  if (!user) return res.json({ ok: true });

  // Desactivar links anteriores
  db.prepare("UPDATE magic_links SET activo = 0 WHERE user_id = ? AND activo = 1").run(user.id);

  const token = 'tkn_' + crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO magic_links (token, user_id, expires_at, activo)
    VALUES (?, ?, ?, 1)
  `).run(token, user.id, expiresAt);

  const url = `${process.env.APP_URL}/api/auth/magic-link/${token}`;
  console.log(`\n🔗 Magic link para ${email}:\n   ${url}\n`);

  // Si hay SMTP configurado, enviar email real
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Tu enlace de acceso — Club Polideportivo',
        html: `<p>Hola ${user.nombre},</p>
               <p>Tu enlace de acceso (válido 15 minutos):</p>
               <p><a href="${url}">${url}</a></p>`,
      }).catch(err => console.error('Error enviando email:', err.message));
    } catch {}
  }

  res.json({ ok: true });
});

// GET /api/auth/magic-link/:token  — valida y devuelve JWT
router.get('/magic-link/:token', (req, res) => {
  const link = db.prepare(`
    SELECT ml.*, u.id as uid, u.nombre, u.email, u.rol, u.estado, u.iniciales, u.avatar_bg,
           u.dni, u.telefono, u.desde
    FROM magic_links ml
    JOIN users u ON u.id = ml.user_id
    WHERE ml.token = ? AND ml.activo = 1
  `).get(req.params.token);

  if (!link) return res.status(401).json({ error: 'Enlace inválido o ya utilizado' });
  if (!link.permanent && new Date(link.expires_at) < new Date()) {
    db.prepare('UPDATE magic_links SET activo = 0 WHERE token = ?').run(req.params.token);
    return res.status(401).json({ error: 'Enlace expirado' });
  }
  if (link.estado === 'inactivo') {
    return res.status(403).json({ error: 'Cuenta inactiva' });
  }

  db.prepare("UPDATE magic_links SET usos = usos + 1, used_at = datetime('now') WHERE token = ?").run(req.params.token);

  const user = { id: link.uid, nombre: link.nombre, email: link.email, rol: link.rol,
                  estado: link.estado, iniciales: link.iniciales, avatar_bg: link.avatar_bg,
                  dni: link.dni, telefono: link.telefono, desde: link.desde };
  const token = signToken(user);

  // Si viene de browser, redirigir al frontend con el token en hash
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    return res.redirect(`${frontendBase}/#magic=${token}`);
  }
  res.json({ token, user });
});

// GET /api/auth/me  — info del usuario autenticado
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, nombre, email, rol, dni, telefono, estado, desde, iniciales, avatar_bg FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseñas requeridas' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ ok: true });
});

module.exports = router;
