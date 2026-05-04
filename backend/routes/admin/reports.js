const express = require('express');
const { query, queryOne } = require('../../db');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { c: alumnosActivos } = await queryOne("SELECT COUNT(*) as c FROM participantes WHERE estado = 'activo'");
    const { c: totalTalleres }  = await queryOne('SELECT COUNT(*) as c FROM talleres');

    const { total: ingresosMes } = await queryOne(`
      SELECT COALESCE(SUM(monto), 0) as total FROM pagos
      WHERE estado = 'pagado' AND TO_CHAR(fecha, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
    `);

    const { pct: asistenciaProm } = await queryOne(`
      SELECT ROUND(100.0 * SUM(CASE WHEN estado IN ('present','late') THEN 1 ELSE 0 END)::numeric / GREATEST(COUNT(*), 1), 0) as pct
      FROM asistencias
      WHERE fecha >= NOW() - INTERVAL '30 days'
    `);

    const { c: linksActivos } = await queryOne(
      "SELECT COUNT(*) as c FROM magic_links WHERE activo = 1 AND expires_at > NOW()"
    );

    res.json({
      alumnosActivos: Number(alumnosActivos),
      totalTalleres:  Number(totalTalleres),
      ingresosMes:    Number(ingresosMes),
      asistenciaProm: Number(asistenciaProm) || 0,
      linksActivos:   Number(linksActivos),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/attendance', requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.disciplina, t.nombre,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.estado IN ('present','late') THEN 1 ELSE 0 END) as presentes,
        COUNT(DISTINCT tp.participante_id) as alumnos
      FROM talleres t
      LEFT JOIN asistencias a ON a.taller_id = t.id
      LEFT JOIN taller_participantes tp ON tp.taller_id = t.id
      GROUP BY t.id, t.disciplina, t.nombre
      ORDER BY t.disciplina
    `);

    const result = rows.map(r => ({
      nombre: r.disciplina,
      pct:    Number(r.total) > 0 ? Math.round((Number(r.presentes) / Number(r.total)) * 100) : 0,
      alumnos: Number(r.alumnos),
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const months = Math.min(Number(req.query.months) || 12, 24);

    const rows = await query(`
      SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, COALESCE(SUM(monto), 0) as total
      FROM pagos WHERE estado = 'pagado'
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT $1
    `, [months]);

    res.json(rows.reverse());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/inscriptions', requireAdmin, async (req, res) => {
  try {
    const months = Math.min(Number(req.query.months) || 12, 24);

    const rows = await query(`
      SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, COUNT(*) as total
      FROM inscripciones
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT $1
    `, [months]);

    res.json(rows.reverse());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
