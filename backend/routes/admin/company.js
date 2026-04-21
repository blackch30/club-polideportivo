const express = require('express');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/company
router.get('/', requireAdmin, (req, res) => {
  const empresa = db.prepare('SELECT * FROM empresa WHERE id = 1').get();
  const sedes = db.prepare('SELECT * FROM sedes ORDER BY nombre').all();
  res.json({ ...empresa, sedes });
});

// PUT /api/admin/company
router.put('/', requireAdmin, (req, res) => {
  const { nombre, razon, cuit, direccion, telefono, email, web, horario, logo, color_marca } = req.body;
  db.prepare(`
    UPDATE empresa SET
      nombre      = COALESCE(?, nombre),
      razon       = COALESCE(?, razon),
      cuit        = COALESCE(?, cuit),
      direccion   = COALESCE(?, direccion),
      telefono    = COALESCE(?, telefono),
      email       = COALESCE(?, email),
      web         = COALESCE(?, web),
      horario     = COALESCE(?, horario),
      logo        = COALESCE(?, logo),
      color_marca = COALESCE(?, color_marca)
    WHERE id = 1
  `).run(nombre||null, razon||null, cuit||null, direccion||null,
         telefono||null, email||null, web||null, horario||null,
         logo||null, color_marca||null);
  res.json({ ok: true });
});

// PUT /api/admin/company/sedes/:id
router.put('/sedes/:id', requireAdmin, (req, res) => {
  const { nombre, direccion, canchas, activa } = req.body;
  db.prepare(`
    UPDATE sedes SET
      nombre    = COALESCE(?, nombre),
      direccion = COALESCE(?, direccion),
      canchas   = COALESCE(?, canchas),
      activa    = COALESCE(?, activa)
    WHERE id = ?
  `).run(nombre||null, direccion||null, canchas??null, activa??null, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
