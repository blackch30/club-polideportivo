const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const professors = await query(`
      SELECT u.id, u.nombre, u.email, u.dni, u.telefono, u.estado, u.desde, u.iniciales, u.avatar_bg,
             (SELECT COUNT(*) FROM talleres WHERE profesor_id = u.id) as talleres
      FROM users u WHERE u.rol = 'profesor'
      ORDER BY u.nombre
    `);

    const result = await Promise.all(professors.map(async p => {
      const disciplinas = (await query(
        'SELECT disciplina FROM profesor_disciplinas WHERE profesor_id = $1', [p.id]
      )).map(d => d.disciplina);

      const link = await queryOne(`
        SELECT token, created_at, expires_at, used_at, usos, activo, permanent
        FROM magic_links WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
      `, [p.id]);

      return { ...p, talleres: Number(p.talleres), disciplinas, link: link || null };
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { nombre, email, dni, telefono, disciplinas = [], desde, password } = req.body;
    if (!nombre || !email) return res.status(400).json({ error: 'nombre y email requeridos' });
    if (password && password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const id = 'p-' + crypto.randomBytes(4).toString('hex');
    const partes = nombre.trim().split(' ');
    const iniciales = partes.length >= 2
      ? partes[0][0].toUpperCase() + partes[partes.length - 1][0].toUpperCase()
      : nombre.slice(0, 2).toUpperCase();
    const hue = Math.floor(Math.random() * 360);
    const passwordHash = bcrypt.hashSync(password || 'clubpoli2026', 10);
    const estado = password ? 'activo' : 'pendiente';

    await query(`
      INSERT INTO users (id, nombre, email, password_hash, rol, dni, telefono, estado, desde, iniciales, avatar_bg)
      VALUES ($1, $2, $3, $4, 'profesor', $5, $6, $7, $8, $9, $10)
    `, [id, nombre.trim(), email.toLowerCase(), passwordHash,
        dni || null, telefono || null, estado,
        desde || String(new Date().getFullYear()),
        iniciales, `oklch(82% 0.12 ${hue})`]);

    for (const d of disciplinas) {
      await query(
        'INSERT INTO profesor_disciplinas (profesor_id, disciplina) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, d]
      );
    }

    const user = await queryOne('SELECT id, nombre, email, rol, estado, iniciales, avatar_bg FROM users WHERE id = $1', [id]);
    res.status(201).json({ ...user, disciplinas, talleres: 0, link: null });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { nombre, email, dni, telefono, estado, disciplinas } = req.body;
    await query(`
      UPDATE users SET
        nombre   = COALESCE($1, nombre),
        email    = COALESCE($2, email),
        dni      = COALESCE($3, dni),
        telefono = COALESCE($4, telefono),
        estado   = COALESCE($5, estado)
      WHERE id = $6
    `, [nombre || null, email ? email.toLowerCase() : null, dni || null, telefono || null, estado || null, req.params.id]);

    if (Array.isArray(disciplinas)) {
      await query('DELETE FROM profesor_disciplinas WHERE profesor_id = $1', [req.params.id]);
      for (const d of disciplinas) {
        await query(
          'INSERT INTO profesor_disciplinas (profesor_id, disciplina) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, d]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = $1 AND rol = 'profesor'", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/:id/magic-link', requireAdmin, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Profesor no encontrado' });

    const permanent = req.body.permanent ? 1 : 0;
    const dias = req.body.dias || 7;

    await query("UPDATE magic_links SET activo = 0 WHERE user_id = $1", [req.params.id]);

    const token = 'tkn_' + crypto.randomBytes(8).toString('hex');
    const expiresAt = permanent
      ? '2099-12-31T23:59:59.000Z'
      : new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    await query(
      'INSERT INTO magic_links (token, user_id, expires_at, activo, permanent) VALUES ($1, $2, $3, 1, $4)',
      [token, req.params.id, expiresAt, permanent]
    );

    const url = `${process.env.APP_URL}/api/auth/magic-link/${token}`;
    console.log(`\n🔗 Magic link ${permanent ? 'PERMANENTE' : `(${dias}d)`} para ${user.email}:\n   ${url}\n`);

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const vigencia = permanent ? 'sin vencimiento' : `válido ${dias} día${dias !== 1 ? 's' : ''}`;
        transporter.sendMail({
          from: `"Club Polideportivo" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Tu enlace de acceso — Club Polideportivo',
          html: `<p>Hola ${user.nombre},</p>
<p>El administrador ha generado un enlace de acceso para tu panel de profesor (${vigencia}):</p>
<p><a href="${url}" style="font-size:16px;font-weight:bold">${url}</a></p>
<p>No compartas este enlace con nadie.</p>`,
        }).catch(err => console.error('Error enviando email:', err.message));
      } catch (err) {
        console.error('Error enviando email:', err.message);
      }
    }

    res.json({ token, url, expires_at: expiresAt, permanent: !!permanent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/:id/magic-link/email', requireAdmin, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Profesor no encontrado' });

    const link = await queryOne(
      'SELECT * FROM magic_links WHERE user_id = $1 AND activo = 1 ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    if (!link) return res.status(404).json({ error: 'No hay enlace activo para este profesor' });

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(503).json({ error: 'El servidor no tiene SMTP configurado' });
    }

    const url = `${process.env.APP_URL}/api/auth/magic-link/${link.token}`;
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Club Polideportivo" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Tu enlace de acceso — Club Polideportivo',
      html: `<p>Hola ${user.nombre},</p>
<p>Aquí está tu enlace de acceso al panel de profesor:</p>
<p><a href="${url}" style="font-size:16px;font-weight:bold">${url}</a></p>
<p>No compartas este enlace con nadie.</p>`,
    });

    res.json({ ok: true, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error enviando email: ' + e.message });
  }
});

router.delete('/:id/magic-link', requireAdmin, async (req, res) => {
  try {
    await query("UPDATE magic_links SET activo = 0 WHERE user_id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
