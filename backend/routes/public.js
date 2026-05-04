const express = require('express');
const { query, queryOne } = require('../db');
const router = express.Router();

router.get('/report', async (req, res) => {
  try {
    const empresa = await queryOne('SELECT nombre, telefono, email, direccion, web FROM empresa WHERE id = 1');
    const talleres = await query(`
      SELECT t.nombre, t.disciplina, t.emoji, t.horario, t.hora, t.sede,
             COUNT(DISTINCT tp.participante_id) as alumnos,
             u.nombre as profesor_nombre
      FROM talleres t
      LEFT JOIN taller_participantes tp ON tp.taller_id = t.id
      LEFT JOIN users u ON u.id = t.profesor_id
      GROUP BY t.id, u.nombre
      ORDER BY t.disciplina, t.nombre
    `);
    const pagosMes = await queryOne(`
      SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as cantidad
      FROM pagos WHERE estado = 'pagado' AND TO_CHAR(fecha, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
    `);
    const asistencia = await queryOne(`
      SELECT ROUND(100.0 * SUM(CASE WHEN estado IN ('present','late') THEN 1 ELSE 0 END)::numeric / GREATEST(COUNT(*), 1), 0) as pct
      FROM asistencias WHERE fecha >= NOW() - INTERVAL '30 days'
    `);
    const totalSocios = await queryOne("SELECT COUNT(*) as c FROM participantes WHERE estado = 'activo'");

    res.json({
      empresa,
      talleres: talleres.map(t => ({ ...t, alumnos: Number(t.alumnos) })),
      resumen: {
        totalSocios: Number(totalSocios.c),
        ingresosMes: Number(pagosMes.total),
        pagosMes: Number(pagosMes.cantidad),
        asistenciaPct: Number(asistencia.pct) || 0,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
