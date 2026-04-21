require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());

// ─── Frontend estático ────────────────────────────────────────
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));
app.get('/', (_, res) => res.sendFile(path.join(frontendDir, 'Panel de Profesor.html')));

// ─── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',                  require('./routes/auth'));
app.use('/api/workshops',             require('./routes/workshops'));
app.use('/api/attendance',            require('./routes/attendance'));
app.use('/api/participants',          require('./routes/participants'));
app.use('/api/admin/professors',      require('./routes/admin/professors'));
app.use('/api/admin/workshops',       require('./routes/admin/workshops'));
app.use('/api/admin/inscriptions',    require('./routes/admin/inscriptions'));
app.use('/api/admin/payments',        require('./routes/admin/payments'));
app.use('/api/admin/reports',         require('./routes/admin/reports'));
app.use('/api/admin/company',         require('./routes/admin/company'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.path}` }));

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Club Polideportivo API corriendo en http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
