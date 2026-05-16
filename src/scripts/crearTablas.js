require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool, initDB } = require('../config/db')

async function crearTablas() {
  await initDB()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Usuarios (
      "IdUsuario"             SERIAL PRIMARY KEY,
      "NombreCompleto"        VARCHAR(100) NOT NULL,
      "CorreoInstitucional"   VARCHAR(100) NOT NULL UNIQUE,
      "PasswordHash"          VARCHAR(256) NOT NULL,
      "Rol"                   VARCHAR(20)  NOT NULL DEFAULT 'Estudiante'
    );

    CREATE TABLE IF NOT EXISTS Estudiante" (
      "IdEstudiante"      SERIAL PRIMARY KEY,
      "Carne"             VARCHAR(20)     NOT NULL,
      "Carrera"           VARCHAR(100)    NOT NULL,
      "SaldoActual"       DECIMAL(10,2)   DEFAULT 0,
      "IdUsuario"         INTEGER         REFERENCES Usuarios("IdUsuario")
    );

    CREATE TABLE IF NOT EXISTS Agentes (
      "IdAgente"      SERIAL PRIMARY KEY,
      "Especialidad"  VARCHAR(100) NOT NULL,
      "NivelAcceso"   INTEGER      DEFAULT 1,
      "SedeAsignada"  VARCHAR(100) NOT NULL,
      "IdUsuario"     INTEGER      REFERENCES Usuarios("IdUsuario")
    );

    CREATE TABLE IF NOT EXISTS Tickets (
      "IdTicket"      SERIAL PRIMARY KEY,
      "FechaCreacion" TIMESTAMP    DEFAULT NOW(),
      "PrioridadSLA"  VARCHAR(10)  NOT NULL DEFAULT 'Baja',
      "TipologiaITIL" VARCHAR(20)  NOT NULL DEFAULT 'Solicitud',
      "Estado"        VARCHAR(20)  NOT NULL DEFAULT 'Abierto',
      "Descripcion"   VARCHAR(1000),
      "IdEstudiante"  INTEGER      REFERENCES Estudiante"("IdEstudiante"),
      "IdAgente"      INTEGER      REFERENCES Agentes("IdAgente")
    );

    CREATE TABLE IF NOT EXISTS EstadosTicket (
      "IdEstado"          SERIAL PRIMARY KEY,
      "NombreEstado"      VARCHAR(20)   NOT NULL,
      "FechaCambio"       TIMESTAMP     DEFAULT NOW(),
      "ComentarioTecnico" VARCHAR(500),
      "IdTicket"          INTEGER       REFERENCES Tickets("IdTicket")
    );

    CREATE TABLE IF NOT EXISTS BasesConocimiento (
      "IdBase"        SERIAL PRIMARY KEY,
      "Categoria"     VARCHAR(100) NOT NULL,
      "TotalArticulos" INTEGER     DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Articulos (
      "IdArticulo"        SERIAL PRIMARY KEY,
      "Titulo"            VARCHAR(200) NOT NULL,
      "ContenidoMarkdown" TEXT         NOT NULL,
      "Vistas"            INTEGER      DEFAULT 0,
      "IdBase"            INTEGER      REFERENCES BasesConocimiento("IdBase")
    );
  `)

  console.log('✅ Tablas creadas en Neon')
  await pool.end()
  process.exit()
}

crearTablas().catch(console.error)