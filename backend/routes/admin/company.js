const express = require('express');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const empresa = await queryOne('SELECT * FROM empresa WHERE id = 1');
    const sedes = await query('SELECT * FROM sedes ORDER BY nombre');
    res.json({ ...empresa, sedes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/', requireAdmin, async (req, res) => {
  try {
    const { nombre, razon, cuit, direccion, telefono, email, web, horario, logo, color_marca } = req.body;
    await query(`
      UPDATE empresa SET
        nombre      = COALESCE($1,  nombre),
        razon       = COALESCE($2,  razon),
        cuit        = COALESCE($3,  cuit),
        direccion   = COALESCE($4,  direccion),
        telefono    = COALESCE($5,  telefono),
        email       = COALESCE($6,  email),
        web         = COALESCE($7,  web),
        horario     = COALESCE($8,  horario),
        logo        = COALESCE($9,  logo),
        color_marca = COALESCE($10, color_marca)
      WHERE id = 1
    `, [nombre||null, razon||null, cuit||null, direccion||null,
        telefono||null, email||null, web||null, horario||null,
        logo||null, color_marca||null]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/sedes/:id', requireAdmin, async (req, res) => {
  try {
    const { nombre, direccion, canchas, activa } = req.body;
    await query(`
      UPDATE sedes SET
        nombre    = COALESCE($1, nombre),
        direccion = COALESCE($2, direccion),
        canchas   = COALESCE($3, canchas),
        activa    = COALESCE($4, activa)
      WHERE id = $5
    `, [nombre||null, direccion||null, canchas??null, activa??null, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
