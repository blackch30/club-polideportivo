const express = require('express');
const crypto = require('crypto');
const db = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/payments/monthly?periodo=YYYY-MM
router.get('/monthly', requireAdmin, (req, res) => {
  const periodo = req.query.periodo || new Date().toISOString().slice(0, 7);

  const talleres = db.prepare(`
    SELECT t.id, t.nombre, t.emoji, t.color, t.horario
    FROM talleres t ORDER BY t.nombre
  `).all();

  const result = talleres.map(t => {
    const inscritos = db.prepare(`
      SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
      FROM participantes p
      JOIN taller_participantes tp ON tp.participante_id = p.id
      WHERE tp.taller_id = ?
      ORDER BY p.nombre
    `).all(t.id);

    const pagosDelMes = db.prepare(`
      SELECT pg.id, pg.monto, pg.estado, pg.metodo, pg.comprobante, pg.fecha, pg.participante_id
      FROM pagos pg
      WHERE pg.taller_id = ? AND pg.periodo = ?
    `).all(t.id, periodo);

    const pagoMap = {};
    pagosDelMes.forEach(pg => { pagoMap[pg.participante_id] = pg; });

    return {
      ...t,
      inscritos: inscritos.map(p => ({ ...p, pago: pagoMap[p.participante_id] || null })),
    };
  }).filter(t => t.inscritos.length > 0);

  const allInscritos = result.flatMap(t => t.inscritos);
  const stats = {
    pagados:  allInscritos.filter(a => a.pago?.estado === 'pagado').length,
    pendientes: allInscritos.filter(a => !a.pago).length,
    total_recaudado: allInscritos.reduce((s, a) => s + (a.pago?.estado === 'pagado' ? a.pago.monto : 0), 0),
    total_alumnos: allInscritos.length,
  };

  res.json({ periodo, talleres: result, stats });
});

// GET /api/admin/payments?estado=&q=&tipo=
router.get('/', requireAdmin, (req, res) => {
  const { estado, q, tipo } = req.query;

  let sql = `
    SELECT pg.*, p.nombre as socio, t.nombre as taller_nombre
    FROM pagos pg
    LEFT JOIN participantes p ON p.id = pg.participante_id
    LEFT JOIN talleres t ON t.id = pg.taller_id
    WHERE 1=1
  `;
  const params = [];

  if (estado && estado !== 'todos') { sql += ' AND pg.estado = ?'; params.push(estado); }
  if (tipo && tipo !== 'todos') { sql += ' AND COALESCE(pg.tipo,\'mensualidad\') = ?'; params.push(tipo); }
  if (q) { sql += ' AND (p.nombre LIKE ? OR pg.concepto LIKE ? OR pg.comentario LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  sql += ' ORDER BY pg.fecha DESC LIMIT 200';
  const pagos = db.prepare(sql).all(...params);

  // Estadísticas globales
  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as pagado,
      SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END) as pendiente,
      SUM(CASE WHEN estado = 'vencido' THEN monto ELSE 0 END) as vencido,
      COUNT(CASE WHEN estado = 'vencido' THEN 1 END) as morosos
    FROM pagos
  `).get();

  // Distribución por método
  const metodos = db.prepare(`
    SELECT metodo, COUNT(*) as cantidad, SUM(monto) as total
    FROM pagos WHERE estado = 'pagado' AND metodo IS NOT NULL
    GROUP BY metodo
  `).all();

  res.json({ pagos, stats, metodos });
});

// POST /api/admin/payments  — registrar pago
router.post('/', requireAdmin, (req, res) => {
  const { participante_id, taller_id, concepto, monto, metodo, inscripcion_id, periodo, tipo, comentario } = req.body;
  if (!monto) return res.status(400).json({ error: 'monto requerido' });

  const id = 'pg-' + crypto.randomBytes(4).toString('hex');
  const comprobante = 'CB-' + String(Math.floor(Math.random() * 90000) + 10000);
  const tipoFinal = tipo || 'mensualidad';
  const conceptoFinal = concepto || (periodo ? `Mensualidad ${periodo}` : tipoFinal === 'mensualidad' ? 'Mensualidad' : tipo);

  db.prepare(`
    INSERT INTO pagos (id, inscripcion_id, participante_id, taller_id, concepto, monto, estado, metodo, comprobante, periodo, tipo, comentario)
    VALUES (?, ?, ?, ?, ?, ?, 'pagado', ?, ?, ?, ?, ?)
  `).run(id, inscripcion_id || null, participante_id || null, taller_id || null,
         conceptoFinal, Number(monto), metodo || null, comprobante, periodo || null, tipoFinal, comentario || null);

  // Si tiene inscripción, marcarla como confirmada
  if (inscripcion_id) {
    db.prepare("UPDATE inscripciones SET estado = 'confirmada', metodo_pago = ? WHERE id = ?")
      .run(metodo || null, inscripcion_id);
  }

  const pago = db.prepare(`
    SELECT pg.*, p.nombre as socio FROM pagos pg
    LEFT JOIN participantes p ON p.id = pg.participante_id
    WHERE pg.id = ?
  `).get(id);

  res.status(201).json(pago);
});

// PUT /api/admin/payments/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { estado, metodo, comprobante } = req.body;
  db.prepare(`
    UPDATE pagos SET estado = COALESCE(?, estado), metodo = COALESCE(?, metodo),
      comprobante = COALESCE(?, comprobante)
    WHERE id = ?
  `).run(estado || null, metodo || null, comprobante || null, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
