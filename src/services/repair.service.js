const { pool } = require('../config/db');

// ─── repairDatabase ──────────────────────────────────────────────────────────
const repairDatabase = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Vincular Estudiantes huérfanos (idusuario IS NULL)
    const repairEstudiantes = await client.query(`
      UPDATE estudiante
      SET idusuario = u.idusuario
      FROM usuarios u
      WHERE estudiante.idusuario IS NULL
        AND (
          (estudiante.carne = '99892311043' AND u.correoinstitucional = 'sgomar@miumg.edu.gt')   OR
          (estudiante.carne = '99892311044' AND u.correoinstitucional = 'fhipolito@miumg.edu.gt') OR
          (estudiante.carne = '99892311045' AND u.correoinstitucional = 'cdeleon@miumg.edu.gt')   OR
          (estudiante.carne = '99892311046' AND u.correoinstitucional = 'ajacinto@miumg.edu.gt')
        )
      RETURNING estudiante.idestudiante
    `)

    // 2. Vincular Agentes huérfanos (idusuario IS NULL)
    const repairAgentes = await client.query(`
      UPDATE agentes
      SET idusuario = u.idusuario
      FROM usuarios u
      WHERE agentes.idusuario IS NULL
        AND (
          (agentes.especialidad = 'Incidente' AND u.correoinstitucional = 'incidentes@miumg.edu.gt') OR
          (agentes.especialidad = 'Solicitud' AND u.correoinstitucional = 'solicitudes@miumg.edu.gt') OR
          (agentes.especialidad = 'Cambio'    AND u.correoinstitucional = 'cambios@miumg.edu.gt')    OR
          (agentes.especialidad = 'General'   AND u.correoinstitucional = 'coordinador@miumg.edu.gt')
        )
      RETURNING agentes.idagente
    `)

    // 3. Vincular tickets sin estudiante
    const repairTicketsEstudiante = await client.query(`
      UPDATE tickets
      SET idestudiante = COALESCE(
        (SELECT idestudiante FROM estudiante
         WHERE idusuario = (SELECT idusuario FROM usuarios WHERE correoinstitucional = 'sgomar@miumg.edu.gt')
         LIMIT 1),
        (SELECT idestudiante FROM estudiante LIMIT 1)
      )
      WHERE idestudiante IS NULL
      RETURNING idticket
    `)

    // 4. Vincular tickets sin agente según tipología
    const repairTicketsAgente = await client.query(`
      UPDATE tickets t
      SET idagente = a.idagente
      FROM agentes a
      WHERE t.idagente IS NULL AND a.especialidad = t.tipologiaitil
      RETURNING t.idticket
    `)

    // 5. Vincular estados de ticket huérfanos
    const repairEstados = await client.query(`
      UPDATE estadosticket e
      SET idticket = sub.idticket
      FROM (
        SELECT est_state.idestado, t.idticket
        FROM (
          SELECT idticket, row_number() OVER (ORDER BY idticket) AS rn FROM tickets
        ) t
        JOIN (
          SELECT idestado, row_number() OVER (ORDER BY idestado) AS rn
          FROM estadosticket WHERE idticket IS NULL
        ) est_state ON t.rn = est_state.rn
      ) sub
      WHERE e.idestado = sub.idestado
      RETURNING e.idestado
    `)

    await client.query('COMMIT')
    return {
      estudiantesReparados:         repairEstudiantes.rowCount,
      agentesReparados:             repairAgentes.rowCount,
      ticketsVinculadosEstudiante:  repairTicketsEstudiante.rowCount,
      ticketsVinculadosAgente:      repairTicketsAgente.rowCount,
      estadosReparados:             repairEstados.rowCount
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
};

module.exports = { repairDatabase };