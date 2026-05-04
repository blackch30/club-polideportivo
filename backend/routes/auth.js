const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, queryOne } = require('../db');
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (user.estado === 'inactivo') return res.status(403).json({ error: 'Cuenta inactiva. Contacte a administración.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/magic-link
router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user) return res.json({ ok: true });

    await query("UPDATE magic_links SET activo = 0 WHERE user_id = $1 AND activo = 1", [user.id]);

    const token = 'tkn_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await query(
      'INSERT INTO magic_links (token, user_id, expires_at, activo) VALUES ($1, $2, $3, 1)',
      [token, user.id, expiresAt]
    );

    const url = `${process.env.APP_URL}/api/auth/magic-link/${token}`;
    console.log(`\n🔗 Magic link para ${email}:\n   ${url}\n`);

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
          html: `<p>Hola ${user.nombre},</p><p>Tu enlace de acceso (válido 15 minutos):</p><p><a href="${url}">${url}</a></p>`,
        }).catch(err => console.error('Error enviando email:', err.message));
      } catch {}
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/auth/magic-link/:token
router.get('/magic-link/:token', async (req, res) => {
  try {
    const link = await queryOne(`
      SELECT ml.*, u.id as uid, u.nombre, u.email, u.rol, u.estado, u.iniciales, u.avatar_bg,
             u.dni, u.telefono, u.desde
      FROM magic_links ml
      JOIN users u ON u.id = ml.user_id
      WHERE ml.token = $1 AND ml.activo = 1
    `, [req.params.token]);

    if (!link) return res.status(401).json({ error: 'Enlace inválido o ya utilizado' });
    if (!link.permanent && new Date(link.expires_at) < new Date()) {
      await query('UPDATE magic_links SET activo = 0 WHERE token = $1', [req.params.token]);
      return res.status(401).json({ error: 'Enlace expirado' });
    }
    if (link.estado === 'inactivo') return res.status(403).json({ error: 'Cuenta inactiva' });

    await query("UPDATE magic_links SET usos = usos + 1, used_at = NOW() WHERE token = $1", [req.params.token]);

    const user = { id: link.uid, nombre: link.nombre, email: link.email, rol: link.rol,
                   estado: link.estado, iniciales: link.iniciales, avatar_bg: link.avatar_bg,
                   dni: link.dni, telefono: link.telefono, desde: link.desde };
    const token = signToken(user);

    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
      const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      return res.redirect(`${frontendBase}/#magic=${token}`);
    }
    res.json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, nombre, email, rol, dni, telefono, estado, desde, iniciales, avatar_bg FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/set-password  (requires auth token)
router.post('/set-password', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    const hash = bcrypt.hashSync(password, 10);
    await query("UPDATE users SET password_hash = $1, estado = 'activo' WHERE id = $2", [hash, req.user.id]);
    const user = await queryOne('SELECT id, nombre, email, rol, dni, telefono, estado, desde, iniciales, avatar_bg FROM users WHERE id = $1', [req.user.id]);
    res.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Contraseñas requeridas' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(newPassword, 10), req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
