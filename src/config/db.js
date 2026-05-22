const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
  ssl: { rejectUnauthorized: false }
})

async function initDB() {
  try {
    await pool.query('SELECT 1')
    console.log('Conexión a Neon PostgreSQL establecida')

    // 0. Vincular Estudiantes y Agentes con sus respectivos Usuarios (IdUsuario IS NULL)
    const checkOrphanEstudiantes = await pool.query('SELECT COUNT(*) FROM Estudiante WHERE IdUsuario IS NULL')
    const orphanEstCount = parseInt(checkOrphanEstudiantes.rows[0].count || checkOrphanEstudiantes.rows[0].COUNT || 0, 10)
    if (orphanEstCount > 0) {
      await pool.query(`
        UPDATE Estudiante 
        SET IdUsuario = u.IdUsuario
        FROM Usuarios u
        WHERE Estudiante.IdUsuario IS NULL 
          AND (
            (Estudiante.Carne = '99892311043' AND u.CorreoInstitucional = 'sgomar@miumg.edu.gt') OR
            (Estudiante.Carne = '99892311044' AND u.CorreoInstitucional = 'fhipolito@miumg.edu.gt') OR
            (Estudiante.Carne = '99892311045' AND u.CorreoInstitucional = 'cdeleon@miumg.edu.gt') OR
            (Estudiante.Carne = '99892311046' AND u.CorreoInstitucional = 'ajacinto@miumg.edu.gt')
          )
      `)
      console.log(`🔧 Autoreparación: Se vincularon ${orphanEstCount} estudiantes con sus correspondientes usuarios`)
    }

    const checkOrphanAgentes = await pool.query('SELECT COUNT(*) FROM Agentes WHERE IdUsuario IS NULL')
    const orphanAgCount = parseInt(checkOrphanAgentes.rows[0].count || checkOrphanAgentes.rows[0].COUNT || 0, 10)
    if (orphanAgCount > 0) {
      await pool.query(`
        UPDATE Agentes
        SET IdUsuario = u.IdUsuario
        FROM Usuarios u
        WHERE Agentes.IdUsuario IS NULL
          AND (
            (Agentes.Especialidad = 'Incidente' AND u.CorreoInstitucional = 'incidentes@miumg.edu.gt') OR
            (Agentes.Especialidad = 'Solicitud' AND u.CorreoInstitucional = 'solicitudes@miumg.edu.gt') OR
            (Agentes.Especialidad = 'Cambio' AND u.CorreoInstitucional = 'cambios@miumg.edu.gt') OR
            (Agentes.Especialidad = 'General' AND u.CorreoInstitucional = 'coordinador@miumg.edu.gt')
          )
      `)
      console.log(`🔧 Autoreparación: Se vincularon ${orphanAgCount} agentes con sus correspondientes usuarios`)
    }

    // 1. Vincular tickets huérfanos sin estudiante (IdEstudiante IS NULL) al primer estudiante disponible
    const checkOrphans = await pool.query('SELECT COUNT(*) FROM Tickets WHERE IdEstudiante IS NULL')
    const orphanCount = parseInt(checkOrphans.rows[0].count || checkOrphans.rows[0].COUNT || 0, 10)
    if (orphanCount > 0) {
      const firstEstudiante = await pool.query('SELECT IdEstudiante FROM Estudiante ORDER BY IdEstudiante ASC LIMIT 1')
      if (firstEstudiante.rows.length > 0) {
        const idEst = firstEstudiante.rows[0].idestudiante || firstEstudiante.rows[0].IdEstudiante
        await pool.query('UPDATE Tickets SET IdEstudiante = $1 WHERE IdEstudiante IS NULL', [idEst])
        console.log(`🔧 Autoreparación: Se vincularon ${orphanCount} tickets huérfanos al estudiante ID ${idEst}`)
      }
    }

    // 2. Vincular tickets huérfanos sin agente (IdAgente IS NULL) al agente que corresponda según la especialidad
    const checkOrphanAgents = await pool.query('SELECT COUNT(*) FROM Tickets WHERE IdAgente IS NULL')
    const orphanAgentCount = parseInt(checkOrphanAgents.rows[0].count || checkOrphanAgents.rows[0].COUNT || 0, 10)
    if (orphanAgentCount > 0) {
      await pool.query(`
        UPDATE Tickets t
        SET IdAgente = a.IdAgente
        FROM Agentes a
        WHERE t.IdAgente IS NULL AND a.Especialidad = t.TipologiaITIL
      `)
      console.log(`🔧 Autoreparación: Se asignaron agentes a ${orphanAgentCount} tickets según su tipología`)
    }

    // 3. Vincular estados de ticket huérfanos (IdTicket IS NULL en EstadosTicket) al ticket correspondiente en base al orden de inserción
    const checkOrphanStates = await pool.query('SELECT COUNT(*) FROM EstadosTicket WHERE IdTicket IS NULL')
    const orphanStateCount = parseInt(checkOrphanStates.rows[0].count || checkOrphanStates.rows[0].COUNT || 0, 10)
    if (orphanStateCount > 0) {
      await pool.query(`
        UPDATE EstadosTicket e
        SET IdTicket = sub.IdTicket
        FROM (
          SELECT 
            est_state.IdEstado,
            t.IdTicket
          FROM (
            SELECT IdTicket, row_number() OVER (ORDER BY IdTicket) as rn FROM Tickets
          ) t
          JOIN (
            SELECT IdEstado, row_number() OVER (ORDER BY IdEstado) as rn FROM EstadosTicket WHERE IdTicket IS NULL
          ) est_state ON t.rn = est_state.rn
        ) sub
        WHERE e.IdEstado = sub.IdEstado
      `)
      console.log(`🔧 Autoreparación: Se restauró la relación de ticket en ${orphanStateCount} estados de la tabla EstadosTicket`)
    }

  } catch (err) {
    console.error('Error conectando a Neon:', err)
    process.exit(1)
  }
}

async function getConnection() {
  return await pool.connect()
}

module.exports = { initDB, getConnection, pool }