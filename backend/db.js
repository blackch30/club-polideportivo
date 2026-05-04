const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Ejecuta una query y devuelve las filas
async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

// Devuelve la primera fila o undefined
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

// Crea todas las tablas si no existen
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      nombre       TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      rol          TEXT NOT NULL DEFAULT 'profesor',
      dni          TEXT,
      telefono     TEXT,
      estado       TEXT NOT NULL DEFAULT 'activo',
      desde        TEXT,
      iniciales    TEXT,
      avatar_bg    TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS magic_links (
      id         SERIAL PRIMARY KEY,
      token      TEXT UNIQUE NOT NULL,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      usos       INTEGER DEFAULT 0,
      activo     INTEGER DEFAULT 1,
      permanent  INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS talleres (
      id          TEXT PRIMARY KEY,
      nombre      TEXT NOT NULL,
      disciplina  TEXT NOT NULL,
      emoji       TEXT,
      horario     TEXT,
      hora        TEXT,
      cupo        INTEGER DEFAULT 20,
      sede        TEXT,
      color       TEXT,
      proxima     TEXT,
      profesor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profesor_disciplinas (
      profesor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      disciplina  TEXT NOT NULL,
      PRIMARY KEY (profesor_id, disciplina)
    );

    CREATE TABLE IF NOT EXISTS participantes (
      id         TEXT PRIMARY KEY,
      nombre     TEXT NOT NULL,
      edad       INTEGER,
      estado     TEXT NOT NULL DEFAULT 'activo',
      iniciales  TEXT,
      avatar_bg  TEXT,
      contacto   TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS taller_participantes (
      taller_id       TEXT NOT NULL REFERENCES talleres(id) ON DELETE CASCADE,
      participante_id TEXT NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
      PRIMARY KEY (taller_id, participante_id)
    );

    CREATE TABLE IF NOT EXISTS inscripciones (
      id              TEXT PRIMARY KEY,
      participante_id TEXT NOT NULL REFERENCES participantes(id),
      taller_id       TEXT NOT NULL REFERENCES talleres(id),
      fecha           DATE DEFAULT CURRENT_DATE,
      estado          TEXT NOT NULL DEFAULT 'pendiente',
      monto           NUMERIC,
      metodo_pago     TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS asistencias (
      id              SERIAL PRIMARY KEY,
      taller_id       TEXT NOT NULL REFERENCES talleres(id) ON DELETE CASCADE,
      participante_id TEXT NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
      fecha           DATE NOT NULL,
      estado          TEXT NOT NULL DEFAULT 'absent',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(taller_id, participante_id, fecha)
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id              TEXT PRIMARY KEY,
      inscripcion_id  TEXT REFERENCES inscripciones(id),
      participante_id TEXT REFERENCES participantes(id),
      taller_id       TEXT REFERENCES talleres(id),
      concepto        TEXT,
      monto           NUMERIC NOT NULL,
      estado          TEXT NOT NULL DEFAULT 'pendiente',
      metodo          TEXT,
      comprobante     TEXT,
      periodo         TEXT,
      tipo            TEXT DEFAULT 'mensualidad',
      comentario      TEXT,
      fecha           DATE DEFAULT CURRENT_DATE,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS empresa (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      nombre      TEXT,
      razon       TEXT,
      cuit        TEXT,
      direccion   TEXT,
      telefono    TEXT,
      email       TEXT,
      web         TEXT,
      horario     TEXT,
      logo        TEXT,
      color_marca TEXT DEFAULT 'lima'
    );

    CREATE TABLE IF NOT EXISTS sedes (
      id        TEXT PRIMARY KEY,
      nombre    TEXT NOT NULL,
      direccion TEXT,
      canchas   INTEGER DEFAULT 0,
      activa    INTEGER DEFAULT 1
    );
  `);

  // Filas por defecto
  await pool.query(`
    INSERT INTO empresa (id, nombre, razon) VALUES (1, 'Club Polideportivo', 'Asociación Civil')
    ON CONFLICT (id) DO NOTHING
  `);
  await pool.query(`
    INSERT INTO sedes (id, nombre, activa) VALUES ('sede-1', 'Sede Principal', 1)
    ON CONFLICT (id) DO NOTHING
  `);
}

module.exports = { pool, query, queryOne, initDB };
