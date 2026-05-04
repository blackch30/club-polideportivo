const express = require('express');
const crypto = require('crypto');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/monthly', requireAdmin, async (req, res) => {
  try {
    const periodo = req.query.periodo || new Date().toISOString().slice(0, 7);

    const talleres = await query('SELECT t.id, t.nombre, t.emoji, t.color, t.horario FROM talleres t ORDER BY t.nombre');

    const result = await Promise.all(talleres.map(async t => {
      const inscritos = await query(`
        SELECT p.id as participante_id, p.nombre, p.iniciales, p.avatar_bg
        FROM participantes p
        JOIN taller_participantes tp ON tp.participante_id = p.id
        WHERE tp.taller_id = $1
        ORDER BY p.nombre
      `, [t.id]);

      const pagosDelMes = await query(`
        SELECT pg.id, pg.monto, pg.estado, pg.metodo, pg.comprobante, pg.fecha, pg.participante_id
        FROM pagos pg
        WHERE pg.taller_id = $1 AND pg.periodo = $2
      `, [t.id, periodo]);

      const pagoMap = {};
      pagosDelMes.forEach(pg => { pagoMap[pg.participante_id] = pg; });

      return {
        ...t,
        inscritos: inscritos.map(p => ({ ...p, pago: pagoMap[p.participante_id] || null })),
      };
    }));

    const filtered = result.filter(t => t.inscritos.length > 0);
    const allInscritos = filtered.flatMap(t => t.inscritos);
    const stats = {
      pagados:         allInscritos.filter(a => a.pago?.estado === 'pagado').length,
      pendientes:      allInscritos.filter(a => !a.pago).length,
      total_recaudado: allInscritos.reduce((s, a) => s + (a.pago?.estado === 'pagado' ? Number(a.pago.monto) : 0), 0),
      total_alumnos:   allInscritos.length,
    };

    res.json({ periodo, talleres: filtered, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { estado, q, tipo } = req.query;
    const params = [];
    let sql = `
      SELECT pg.*, p.nombre as socio, t.nombre as taller_nombre
      FROM pagos pg
      LEFT JOIN participantes p ON p.id = pg.participante_id
      LEFT JOIN talleres t ON t.id = pg.taller_id
      WHERE 1=1
    `;

    if (estado && estado !== 'todos') { params.push(estado); sql += ` AND pg.estado = $${params.length}`; }
    if (tipo && tipo !== 'todos')     { params.push(tipo);   sql += ` AND COALESCE(pg.tipo,'mensualidad') = $${params.length}`; }
    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.nombre ILIKE $${params.length} OR pg.concepto ILIKE $${params.length} OR pg.comentario ILIKE $${params.length})`;
    }

    sql += ' ORDER BY pg.fecha DESC LIMIT 200';
    const pagos = await query(sql, params);

    const stats = await queryOne(`
      SELECT
        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0)    as pagado,
        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END), 0) as pendiente,
        COALESCE(SUM(CASE WHEN estado = 'vencido' THEN monto ELSE 0 END), 0)   as vencido,
        COUNT(CASE WHEN estado = 'vencido' THEN 1 END)                          as morosos
      FROM pagos
    `);

    const metodos = await query(`
      SELECT metodo, COUNT(*) as cantidad, SUM(monto) as total
      FROM pagos WHERE estado = 'pagado' AND metodo IS NOT NULL
      GROUP BY metodo
    `);

    res.json({ pagos, stats, metodos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { participante_id, taller_id, concepto, monto, metodo, inscripcion_id, periodo, tipo, comentario } = req.body;
    if (!monto) return res.status(400).json({ error: 'monto requerido' });

    const id = 'pg-' + crypto.randomBytes(4).toString('hex');
    const comprobante = 'CB-' + String(Math.floor(Math.random() * 90000) + 10000);
    const tipoFinal = tipo || 'mensualidad';
    const conceptoFinal = concepto || (periodo ? `Mensualidad ${periodo}` : tipoFinal === 'mensualidad' ? 'Mensualidad' : tipo);

    await query(`
      INSERT INTO pagos (id, inscripcion_id, participante_id, taller_id, concepto, monto, estado, metodo, comprobante, periodo, tipo, comentario)
      VALUES ($1, $2, $3, $4, $5, $6, 'pagado', $7, $8, $9, $10, $11)
    `, [id, inscripcion_id || null, participante_id || null, taller_id || null,
        conceptoFinal, Number(monto), metodo || null, comprobante, periodo || null, tipoFinal, comentario || null]);

    if (inscripcion_id) {
      await query("UPDATE inscripciones SET estado = 'confirmada', metodo_pago = $1 WHERE id = $2",
        [metodo || null, inscripcion_id]);
    }

    const pago = await queryOne(`
      SELECT pg.*, p.nombre as socio FROM pagos pg
      LEFT JOIN participantes p ON p.id = pg.participante_id
      WHERE pg.id = $1
    `, [id]);

    res.status(201).json(pago);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { estado, metodo, comprobante } = req.body;
    await query(`
      UPDATE pagos SET
        estado      = COALESCE($1, estado),
        metodo      = COALESCE($2, metodo),
        comprobante = COALESCE($3, comprobante)
      WHERE id = $4
    `, [estado || null, metodo || null, comprobante || null, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
