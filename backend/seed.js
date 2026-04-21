require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('🌱 Iniciando seed...');

// Limpiar datos existentes (orden inverso a las FK)
db.exec(`
  DELETE FROM pagos;
  DELETE FROM asistencias;
  DELETE FROM inscripciones;
  DELETE FROM taller_participantes;
  DELETE FROM participantes;
  DELETE FROM profesor_disciplinas;
  DELETE FROM talleres;
  DELETE FROM magic_links;
  DELETE FROM sedes;
  DELETE FROM empresa;
  DELETE FROM users;
`);

// ─── Usuarios ────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync('admin123', 10);
const profesorHash = bcrypt.hashSync('profesor123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (id, nombre, email, password_hash, rol, dni, telefono, estado, desde, iniciales, avatar_bg)
  VALUES (@id, @nombre, @email, @password_hash, @rol, @dni, @telefono, @estado, @desde, @iniciales, @avatar_bg)
`);

const users = [
  { id: 'p-admin',   nombre: 'Administración', email: 'admin@clubpoli.com',             password_hash: passwordHash,  rol: 'admin',   dni: null,          telefono: null,               estado: 'activo',   desde: '2020', iniciales: 'AD', avatar_bg: 'oklch(82% 0.12 200)' },
  { id: 'p-cmendez', nombre: 'Carlos Méndez',  email: 'carlos.mendez@clubpoli.com',     password_hash: profesorHash,  rol: 'profesor', dni: '28.451.902',  telefono: '+54 11 4455-1230', estado: 'activo',   desde: '2022', iniciales: 'CM', avatar_bg: 'oklch(82% 0.12 125)' },
  { id: 'p-lferrari',nombre: 'Laura Ferrari',  email: 'laura.ferrari@clubpoli.com',     password_hash: profesorHash,  rol: 'profesor', dni: '32.118.774',  telefono: '+54 11 5566-7788', estado: 'activo',   desde: '2023', iniciales: 'LF', avatar_bg: 'oklch(82% 0.13 230)' },
  { id: 'p-agarcia', nombre: 'Ana García',     email: 'ana.garcia@clubpoli.com',        password_hash: profesorHash,  rol: 'profesor', dni: '30.992.501',  telefono: '+54 11 2233-4455', estado: 'activo',   desde: '2021', iniciales: 'AG', avatar_bg: 'oklch(82% 0.12 300)' },
  { id: 'p-jmartin', nombre: 'Javier Martín',  email: 'javier.martin@clubpoli.com',     password_hash: profesorHash,  rol: 'profesor', dni: '26.500.112',  telefono: '+54 11 9988-7766', estado: 'pendiente',desde: '2026', iniciales: 'JM', avatar_bg: 'oklch(82% 0.14 80)'  },
  { id: 'p-mroldan', nombre: 'Mariana Roldán', email: 'mariana.roldan@clubpoli.com',    password_hash: profesorHash,  rol: 'profesor', dni: '29.870.432',  telefono: '+54 11 3344-5566', estado: 'inactivo', desde: '2020', iniciales: 'MR', avatar_bg: 'oklch(82% 0.14 340)' },
];
users.forEach(u => insertUser.run(u));

// ─── Disciplinas por profesor ────────────────────────────────
const insertDisc = db.prepare('INSERT OR IGNORE INTO profesor_disciplinas (profesor_id, disciplina) VALUES (?, ?)');
[
  ['p-cmendez',  'Fútbol'], ['p-cmendez', 'Básquet'],
  ['p-lferrari', 'Natación'],
  ['p-agarcia',  'Yoga'], ['p-agarcia', 'Atletismo'],
  ['p-jmartin',  'Tenis'],
  ['p-mroldan',  'Danza'],
].forEach(([pid, disc]) => insertDisc.run(pid, disc));

// ─── Talleres ─────────────────────────────────────────────────
const insertTaller = db.prepare(`
  INSERT INTO talleres (id, nombre, disciplina, emoji, horario, hora, cupo, sede, color, proxima, profesor_id)
  VALUES (@id, @nombre, @disciplina, @emoji, @horario, @hora, @cupo, @sede, @color, @proxima, @profesor_id)
`);

const talleres = [
  { id: 'w-futbol-a',  nombre: 'Fútbol Sub-15',       disciplina: 'Fútbol',    emoji: '⚽', horario: 'Lun · Mié · Vie', hora: '17:00 – 18:30', cupo: 20, sede: 'Cancha 2',        color: 'oklch(82% 0.16 140)', proxima: 'Hoy, 17:00',    profesor_id: 'p-cmendez'  },
  { id: 'w-natacion',  nombre: 'Natación Iniciación',  disciplina: 'Natación',  emoji: '🏊', horario: 'Mar · Jue',       hora: '18:00 – 19:00', cupo: 12, sede: 'Pileta cubierta', color: 'oklch(82% 0.13 230)', proxima: 'Mañana, 18:00', profesor_id: 'p-lferrari' },
  { id: 'w-yoga',      nombre: 'Yoga Juvenil',         disciplina: 'Yoga',      emoji: '🧘', horario: 'Mié · Sáb',       hora: '09:00 – 10:00', cupo: 15, sede: 'Sala multiuso',   color: 'oklch(82% 0.12 300)', proxima: 'Sáb, 09:00',    profesor_id: 'p-agarcia'  },
  { id: 'w-basquet',   nombre: 'Básquet Sub-16',       disciplina: 'Básquet',   emoji: '🏀', horario: 'Lun · Jue',       hora: '19:00 – 20:30', cupo: 16, sede: 'Gimnasio A',      color: 'oklch(82% 0.16 50)',  proxima: 'Lun, 19:00',    profesor_id: 'p-cmendez'  },
  { id: 'w-atletismo', nombre: 'Atletismo',            disciplina: 'Atletismo', emoji: '🏃', horario: 'Mar · Jue · Sáb', hora: '07:30 – 09:00', cupo: 25, sede: 'Pista exterior',  color: 'oklch(82% 0.14 80)',  proxima: 'Mar, 07:30',    profesor_id: 'p-agarcia'  },
];
talleres.forEach(t => insertTaller.run(t));

// ─── Participantes ────────────────────────────────────────────
const insertPart = db.prepare(`
  INSERT INTO participantes (id, nombre, edad, estado, iniciales, avatar_bg)
  VALUES (@id, @nombre, @edad, @estado, @iniciales, @avatar_bg)
`);

const participantes = [
  { id: 'u01', nombre: 'Martina Álvarez',   edad: 14, estado: 'activo',   iniciales: 'MA', avatar_bg: 'oklch(82% 0.12 30)'  },
  { id: 'u02', nombre: 'Joaquín Bello',     edad: 15, estado: 'activo',   iniciales: 'JB', avatar_bg: 'oklch(82% 0.12 70)'  },
  { id: 'u03', nombre: 'Sofía Carrasco',    edad: 13, estado: 'activo',   iniciales: 'SC', avatar_bg: 'oklch(82% 0.12 110)' },
  { id: 'u04', nombre: 'Matías Domínguez',  edad: 16, estado: 'activo',   iniciales: 'MD', avatar_bg: 'oklch(82% 0.12 150)' },
  { id: 'u05', nombre: 'Lucía Esteban',     edad: 14, estado: 'inactivo', iniciales: 'LE', avatar_bg: 'oklch(82% 0.12 190)' },
  { id: 'u06', nombre: 'Nicolás Fuentes',   edad: 15, estado: 'activo',   iniciales: 'NF', avatar_bg: 'oklch(82% 0.12 230)' },
  { id: 'u07', nombre: 'Valentina Gómez',   edad: 14, estado: 'activo',   iniciales: 'VG', avatar_bg: 'oklch(82% 0.12 270)' },
  { id: 'u08', nombre: 'Tomás Herrera',     edad: 16, estado: 'activo',   iniciales: 'TH', avatar_bg: 'oklch(82% 0.12 310)' },
  { id: 'u09', nombre: 'Camila Ibáñez',     edad: 13, estado: 'activo',   iniciales: 'CI', avatar_bg: 'oklch(82% 0.12 350)' },
  { id: 'u10', nombre: 'Benjamín Juárez',   edad: 15, estado: 'activo',   iniciales: 'BJ', avatar_bg: 'oklch(82% 0.12 50)'  },
  { id: 'u11', nombre: 'Agustina Klein',    edad: 14, estado: 'activo',   iniciales: 'AK', avatar_bg: 'oklch(82% 0.12 90)'  },
  { id: 'u12', nombre: 'Federico López',    edad: 16, estado: 'activo',   iniciales: 'FL', avatar_bg: 'oklch(82% 0.12 130)' },
  { id: 'u13', nombre: 'Julieta Morales',   edad: 13, estado: 'activo',   iniciales: 'JM', avatar_bg: 'oklch(82% 0.12 170)' },
  { id: 'u14', nombre: 'Emilio Navarro',    edad: 15, estado: 'inactivo', iniciales: 'EN', avatar_bg: 'oklch(82% 0.12 210)' },
  { id: 'u15', nombre: 'Renata Ortiz',      edad: 14, estado: 'activo',   iniciales: 'RO', avatar_bg: 'oklch(82% 0.12 250)' },
  { id: 'u16', nombre: 'Ignacio Paredes',   edad: 16, estado: 'activo',   iniciales: 'IP', avatar_bg: 'oklch(82% 0.12 290)' },
  { id: 'u17', nombre: 'Antonella Quiroga', edad: 13, estado: 'activo',   iniciales: 'AQ', avatar_bg: 'oklch(82% 0.12 330)' },
  { id: 'u18', nombre: 'Santino Rivas',     edad: 15, estado: 'activo',   iniciales: 'SR', avatar_bg: 'oklch(82% 0.12 10)'  },
];
participantes.forEach(p => insertPart.run(p));

// ─── Inscripciones taller-participante ───────────────────────
const insertTP = db.prepare('INSERT OR IGNORE INTO taller_participantes (taller_id, participante_id) VALUES (?, ?)');
const tallerParticipantes = {
  'w-futbol-a':  ['u02','u04','u06','u08','u10','u12','u14','u16','u18','u01'],
  'w-natacion':  ['u01','u03','u05','u07','u09','u11','u13','u15','u17'],
  'w-yoga':      ['u01','u03','u05','u07','u09','u11','u13'],
  'w-basquet':   ['u02','u04','u06','u08','u10','u12','u16','u18'],
  'w-atletismo': ['u02','u04','u06','u07','u10','u11','u13','u15','u17','u18'],
};
for (const [tid, pids] of Object.entries(tallerParticipantes)) {
  pids.forEach(pid => insertTP.run(tid, pid));
}

// ─── Inscripciones formales ───────────────────────────────────
const insertInsc = db.prepare(`
  INSERT INTO inscripciones (id, participante_id, taller_id, fecha, estado, monto, metodo_pago)
  VALUES (@id, @participante_id, @taller_id, @fecha, @estado, @monto, @metodo_pago)
`);
[
  { id: 'i01', participante_id: 'u01', taller_id: 'w-yoga',      fecha: '2026-04-17', estado: 'confirmada', monto: 8500,  metodo_pago: 'Transferencia' },
  { id: 'i02', participante_id: 'u02', taller_id: 'w-futbol-a',  fecha: '2026-04-17', estado: 'pendiente',  monto: 9200,  metodo_pago: null            },
  { id: 'i03', participante_id: 'u03', taller_id: 'w-natacion',  fecha: '2026-04-16', estado: 'confirmada', monto: 11000, metodo_pago: 'Tarjeta'       },
  { id: 'i04', participante_id: 'u08', taller_id: 'w-basquet',   fecha: '2026-04-16', estado: 'confirmada', monto: 9200,  metodo_pago: 'Efectivo'      },
  { id: 'i05', participante_id: 'u07', taller_id: 'w-atletismo', fecha: '2026-04-15', estado: 'cancelada',  monto: 7500,  metodo_pago: null            },
  { id: 'i06', participante_id: 'u12', taller_id: 'w-futbol-a',  fecha: '2026-04-15', estado: 'confirmada', monto: 9200,  metodo_pago: 'Tarjeta'       },
  { id: 'i07', participante_id: 'u09', taller_id: 'w-yoga',      fecha: '2026-04-14', estado: 'confirmada', monto: 8500,  metodo_pago: 'Transferencia' },
  { id: 'i08', participante_id: 'u10', taller_id: 'w-atletismo', fecha: '2026-04-14', estado: 'pendiente',  monto: 7500,  metodo_pago: null            },
  { id: 'i09', participante_id: 'u13', taller_id: 'w-natacion',  fecha: '2026-04-13', estado: 'confirmada', monto: 11000, metodo_pago: 'Transferencia' },
  { id: 'i10', participante_id: 'u18', taller_id: 'w-basquet',   fecha: '2026-04-12', estado: 'confirmada', monto: 9200,  metodo_pago: 'Efectivo'      },
].forEach(i => insertInsc.run(i));

// ─── Pagos ────────────────────────────────────────────────────
const insertPago = db.prepare(`
  INSERT INTO pagos (id, participante_id, taller_id, concepto, monto, estado, metodo, comprobante, fecha)
  VALUES (@id, @participante_id, @taller_id, @concepto, @monto, @estado, @metodo, @comprobante, @fecha)
`);
[
  { id: 'pg01', participante_id: 'u01', taller_id: 'w-yoga',      concepto: 'Yoga Juvenil · Abril',      monto: 8500,  estado: 'pagado',      metodo: 'Transferencia', comprobante: 'CB-8821', fecha: '2026-04-17' },
  { id: 'pg02', participante_id: 'u02', taller_id: 'w-futbol-a',  concepto: 'Fútbol Sub-15 · Abril',     monto: 9200,  estado: 'pendiente',   metodo: null,            comprobante: null,      fecha: '2026-04-17' },
  { id: 'pg03', participante_id: 'u03', taller_id: 'w-natacion',  concepto: 'Natación Inic. · Abril',    monto: 11000, estado: 'pagado',      metodo: 'Tarjeta',       comprobante: 'CB-8820', fecha: '2026-04-16' },
  { id: 'pg04', participante_id: 'u08', taller_id: 'w-basquet',   concepto: 'Básquet Sub-16 · Abril',    monto: 9200,  estado: 'pagado',      metodo: 'Efectivo',      comprobante: 'CB-8819', fecha: '2026-04-16' },
  { id: 'pg05', participante_id: 'u07', taller_id: 'w-atletismo', concepto: 'Atletismo · Marzo',         monto: 7500,  estado: 'vencido',     metodo: null,            comprobante: null,      fecha: '2026-04-02' },
  { id: 'pg06', participante_id: 'u12', taller_id: 'w-futbol-a',  concepto: 'Fútbol Sub-15 · Abril',     monto: 9200,  estado: 'pagado',      metodo: 'Tarjeta',       comprobante: 'CB-8818', fecha: '2026-04-15' },
  { id: 'pg07', participante_id: 'u09', taller_id: 'w-yoga',      concepto: 'Yoga Juvenil · Abril',      monto: 8500,  estado: 'pagado',      metodo: 'Transferencia', comprobante: 'CB-8817', fecha: '2026-04-14' },
  { id: 'pg08', participante_id: 'u10', taller_id: 'w-atletismo', concepto: 'Atletismo · Abril',         monto: 7500,  estado: 'pendiente',   metodo: null,            comprobante: null,      fecha: '2026-04-14' },
  { id: 'pg09', participante_id: 'u13', taller_id: 'w-natacion',  concepto: 'Natación Inic. · Abril',    monto: 11000, estado: 'pagado',      metodo: 'Transferencia', comprobante: 'CB-8816', fecha: '2026-04-13' },
  { id: 'pg10', participante_id: 'u18', taller_id: 'w-basquet',   concepto: 'Básquet Sub-16 · Abril',    monto: 9200,  estado: 'pagado',      metodo: 'Efectivo',      comprobante: 'CB-8815', fecha: '2026-04-12' },
  { id: 'pg11', participante_id: 'u05', taller_id: 'w-natacion',  concepto: 'Natación · Marzo',          monto: 11000, estado: 'vencido',     metodo: null,            comprobante: null,      fecha: '2026-03-20' },
  { id: 'pg12', participante_id: 'u14', taller_id: 'w-futbol-a',  concepto: 'Fútbol Sub-15 · Marzo',     monto: 9200,  estado: 'reembolsado', metodo: 'Tarjeta',       comprobante: 'CB-8801', fecha: '2026-04-01' },
].forEach(p => insertPago.run(p));

// ─── Historial de asistencias ─────────────────────────────────
const insertAsist = db.prepare(`
  INSERT OR IGNORE INTO asistencias (taller_id, participante_id, fecha, estado)
  VALUES (?, ?, ?, ?)
`);

const historial = {
  'w-futbol-a': [
    { fecha: '2026-04-15', presentes: ['u02','u04','u06','u08','u10','u12','u16','u18'], ausentes: ['u14','u01'] },
    { fecha: '2026-04-13', presentes: ['u02','u04','u06','u08','u10','u12','u16','u18','u01'], ausentes: ['u14'] },
    { fecha: '2026-04-10', presentes: ['u02','u04','u06','u08','u10','u12','u14','u16','u18','u01'], ausentes: [] },
    { fecha: '2026-04-08', presentes: ['u02','u04','u06','u08','u10','u12','u16'], ausentes: ['u14','u18','u01'] },
  ],
  'w-natacion': [
    { fecha: '2026-04-16', presentes: ['u01','u03','u07','u09','u11','u13','u15'], ausentes: ['u05','u17'] },
    { fecha: '2026-04-14', presentes: ['u01','u03','u05','u07','u09','u11','u13','u15','u17'], ausentes: [] },
  ],
  'w-yoga': [
    { fecha: '2026-04-15', presentes: ['u01','u03','u07','u09','u11'], ausentes: ['u05','u13'] },
    { fecha: '2026-04-11', presentes: ['u01','u03','u05','u07','u09','u11','u13'], ausentes: [] },
  ],
  'w-basquet': [
    { fecha: '2026-04-13', presentes: ['u02','u04','u06','u08','u10','u12','u16'], ausentes: ['u18'] },
    { fecha: '2026-04-09', presentes: ['u02','u04','u06','u08','u10','u12','u16','u18'], ausentes: [] },
  ],
  'w-atletismo': [
    { fecha: '2026-04-16', presentes: ['u02','u04','u06','u07','u10','u11','u13','u15','u17'], ausentes: ['u18'] },
    { fecha: '2026-04-14', presentes: ['u02','u04','u06','u07','u10','u11','u13','u15','u17','u18'], ausentes: [] },
  ],
};

for (const [tallerId, sesiones] of Object.entries(historial)) {
  for (const sesion of sesiones) {
    sesion.presentes.forEach(pid => insertAsist.run(tallerId, pid, sesion.fecha, 'present'));
    sesion.ausentes.forEach(pid => insertAsist.run(tallerId, pid, sesion.fecha, 'absent'));
  }
}

// ─── Empresa ──────────────────────────────────────────────────
db.prepare(`
  INSERT INTO empresa (id, nombre, razon, cuit, direccion, telefono, email, web, horario)
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Club Polideportivo Municipal',
  'Asociación Civil Club Polideportivo',
  '30-71245688-3',
  'Av. Libertador 4250, CABA',
  '+54 11 4000-1000',
  'contacto@clubpoli.com',
  'clubpoli.com',
  'Lun a Vie · 08:00 – 22:00  ·  Sáb 09:00 – 14:00'
);

const insertSede = db.prepare('INSERT INTO sedes (id, nombre, direccion, canchas, activa) VALUES (?, ?, ?, ?, ?)');
[
  ['s1', 'Sede Central', 'Av. Libertador 4250', 6, 1],
  ['s2', 'Sede Norte',   'Av. Maipú 1100',      3, 1],
  ['s3', 'Sede Oeste',   'Rivadavia 8800',       4, 0],
].forEach(s => insertSede.run(...s));

console.log('✅ Seed completado correctamente.');
console.log('');
console.log('Credenciales de acceso:');
console.log('  Admin:    admin@clubpoli.com     / admin123');
console.log('  Profesor: carlos.mendez@clubpoli.com / profesor123');
