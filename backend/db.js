// Usa node:sqlite (integrado en Node.js 22+) — sin compilación nativa
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const _db = new DatabaseSync(path.join(__dirname, 'clubpoli.db'));

// Wrapper compatible con la API de better-sqlite3 (síncrono)
const db = {
  _db,

  exec(sql) {
    _db.exec(sql);
  },

  pragma(str) {
    _db.exec(`PRAGMA ${str}`);
  },

  prepare(sql) {
    const stmt = _db.prepare(sql);
    return {
      get(...args)  { return stmt.get(...args); },
      all(...args)  { return stmt.all(...args); },
      run(...args)  { return stmt.run(...args); },
    };
  },

  // Implementa el patrón transaction de better-sqlite3
  transaction(fn) {
    return (...args) => {
      _db.exec('BEGIN');
      try {
        const result = fn(...args);
        _db.exec('COMMIT');
        return result;
      } catch (e) {
        _db.exec('ROLLBACK');
        throw e;
      }
    };
  },
};

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    nombre     TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    rol        TEXT NOT NULL DEFAULT 'profesor',
    dni        TEXT,
    telefono   TEXT,
    estado     TEXT NOT NULL DEFAULT 'activo',
    desde      TEXT,
    iniciales  TEXT,
    avatar_bg  TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS magic_links (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token      TEXT UNIQUE NOT NULL,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    used_at    TEXT,
    usos       INTEGER DEFAULT 0,
    activo     INTEGER DEFAULT 1
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
    created_at  TEXT DEFAULT (datetime('now'))
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
    created_at TEXT DEFAULT (datetime('now'))
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
    fecha           TEXT DEFAULT (date('now')),
    estado          TEXT NOT NULL DEFAULT 'pendiente',
    monto           REAL,
    metodo_pago     TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS asistencias (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    taller_id       TEXT NOT NULL REFERENCES talleres(id) ON DELETE CASCADE,
    participante_id TEXT NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
    fecha           TEXT NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'absent',
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(taller_id, participante_id, fecha)
  );

  CREATE TABLE IF NOT EXISTS pagos (
    id              TEXT PRIMARY KEY,
    inscripcion_id  TEXT REFERENCES inscripciones(id),
    participante_id TEXT REFERENCES participantes(id),
    taller_id       TEXT REFERENCES talleres(id),
    concepto        TEXT,
    monto           REAL NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'pendiente',
    metodo          TEXT,
    comprobante     TEXT,
    fecha           TEXT DEFAULT (date('now')),
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS empresa (
    id        INTEGER PRIMARY KEY DEFAULT 1,
    nombre    TEXT,
    razon     TEXT,
    cuit      TEXT,
    direccion TEXT,
    telefono  TEXT,
    email     TEXT,
    web       TEXT,
    horario   TEXT
  );

  CREATE TABLE IF NOT EXISTS sedes (
    id        TEXT PRIMARY KEY,
    nombre    TEXT NOT NULL,
    direccion TEXT,
    canchas   INTEGER DEFAULT 0,
    activa    INTEGER DEFAULT 1
  );
`);

// Migraciones de columnas
try { db._db.exec('ALTER TABLE pagos ADD COLUMN periodo TEXT'); } catch(e) {}
try { db._db.exec('ALTER TABLE magic_links ADD COLUMN permanent INTEGER DEFAULT 0'); } catch(e) {}
try { db._db.exec("ALTER TABLE pagos ADD COLUMN tipo TEXT DEFAULT 'mensualidad'"); } catch(e) {}
try { db._db.exec('ALTER TABLE pagos ADD COLUMN comentario TEXT'); } catch(e) {}
try { db._db.exec('ALTER TABLE empresa ADD COLUMN logo TEXT'); } catch(e) {}
try { db._db.exec("ALTER TABLE empresa ADD COLUMN color_marca TEXT DEFAULT 'lima'"); } catch(e) {}
// Garantizar fila empresa y sede por defecto
try { db._db.exec("INSERT OR IGNORE INTO empresa (id, nombre, razon) VALUES (1, 'Club Polideportivo', 'Asociación Civil')"); } catch(e) {}
try { db._db.exec("INSERT OR IGNORE INTO sedes (id, nombre, activa) VALUES ('sede-1', 'Sede Principal', 1)"); } catch(e) {}

module.exports = db;
