const { pool } = require('../config/db')

const crearTicket = async ({ tipologiaITIL, descripcion, idEstudiante }) => {
  const tipologiasValidas = ['Incidente', 'Solicitud', 'Cambio']
  if (!tipologiasValidas.includes(tipologiaITIL)) throw new Error('Tipología inválida')

  const prioridad = tipologiaITIL === 'Incidente' ? 'Alta'
    : tipologiaITIL === 'Solicitud' ? 'Media' : 'Baja'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Traducir el idUsuario (que viene en el parámetro idEstudiante) al IdEstudiante real
    const estudianteResult = await client.query(
      `SELECT IdEstudiante FROM Estudiante WHERE IdUsuario = $1 LIMIT 1`,
      [idEstudiante]
    )
    if (estudianteResult.rows.length === 0) throw new Error('Estudiante no encontrado')
    const realIdEstudiante = estudianteResult.rows[0].IdEstudiante || estudianteResult.rows[0].idestudiante

    const correoMap = {
      'Incidente': 'incidentes@miumg.edu.gt',
      'Solicitud': 'solicitudes@miumg.edu.gt',
      'Cambio': 'cambios@miumg.edu.gt'
    }
    const correoAsignado = correoMap[tipologiaITIL]

    const agente = await client.query(
      `SELECT a.IdAgente 
       FROM Agentes a
       JOIN Usuarios u ON a.IdUsuario = u.IdUsuario
       WHERE u.CorreoInstitucional = $1 LIMIT 1`,
      [correoAsignado]
    )
    const idAgente = agente.rows.length > 0 ? (agente.rows[0].IdAgente || agente.rows[0].idagente) : null

    const ticket = await client.query(
      `INSERT INTO Tickets (FechaCreacion, PrioridadSLA, TipologiaITIL, Estado, IdEstudiante, Descripcion, IdAgente)
       VALUES (NOW(), $1, $2, 'Abierto', $3, $4, $5)
       RETURNING IdTicket`,
      [prioridad, tipologiaITIL, realIdEstudiante, descripcion, idAgente]
    )

    const idTicket = ticket.rows[0].IdTicket || ticket.rows[0].idticket

    await client.query(
      `INSERT INTO EstadosTicket (NombreEstado, FechaCambio, ComentarioTecnico, IdTicket)
       VALUES ('Abierto', NOW(), 'Ticket creado', $1)`,
      [idTicket]
    )

    await client.query('COMMIT')
    return { idTicket, tipologiaITIL, prioridadSLA: prioridad, estado: 'Abierto' }

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const obtenerTicketsEstudiante = async (idEstudiante) => {
  const result = await pool.query(
    `SELECT 
      t.IdTicket, t.FechaCreacion, t.PrioridadSLA,
      t.TipologiaITIL, t.Estado, t.Descripcion,
      (SELECT e.NombreEstado FROM EstadosTicket e
       WHERE e.IdTicket = t.IdTicket
       ORDER BY e.FechaCambio DESC LIMIT 1) AS UltimoEstado
     FROM Tickets t
     JOIN Estudiante est ON t.IdEstudiante = est.IdEstudiante
     WHERE est.IdUsuario = $1
     ORDER BY t.FechaCreacion DESC`,
    [idEstudiante]
  )

  return result.rows.map(r => ({
    idTicket:     r.IdTicket || r.idticket,
    fechaCreacion: r.FechaCreacion || r.fechacreacion,
    prioridadSLA: r.PrioridadSLA || r.prioridadsla,
    tipologiaITIL: r.TipologiaITIL || r.tipologiaitil,
    estado:       r.Estado || r.estado,
    descripcion:  r.Descripcion || r.descripcion,
    ultimoEstado: r.UltimoEstado || r.ultimoestado
  }))
}

const obtenerUltimoTicket = async (idEstudiante) => {
  const result = await pool.query(
    `SELECT t.IdTicket, t.FechaCreacion, t.PrioridadSLA, t.TipologiaITIL, t.Estado, t.Descripcion
     FROM Tickets t
     JOIN Estudiante est ON t.IdEstudiante = est.IdEstudiante
     WHERE est.IdUsuario = $1
     ORDER BY t.FechaCreacion DESC LIMIT 1`,
    [idEstudiante]
  )

  if (result.rows.length === 0) return null
  const r = result.rows[0]
  return {
    idTicket:     r.IdTicket || r.idticket,
    fechaCreacion: r.FechaCreacion || r.fechacreacion,
    prioridadSLA: r.PrioridadSLA || r.prioridadsla,
    tipologiaITIL: r.TipologiaITIL || r.tipologiaitil,
    estado:       r.Estado || r.estado,
    descripcion:  r.Descripcion || r.descripcion
  }
}

const repairDatabase = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Vincular Estudiantes con Usuarios si están huérfanos (IdUsuario IS NULL)
    const repairEstudiantes = await client.query(`
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
      RETURNING Estudiante.IdEstudiante
    `)

    // 2. Vincular Agentes con Usuarios si están huérfanos (IdUsuario IS NULL)
    const repairAgentes = await client.query(`
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
      RETURNING Agentes.IdAgente
    `)

    // 3. Vincular tickets huérfanos sin estudiante (IdEstudiante IS NULL) al primer estudiante (Sergio Gomar)
    const repairTicketsEstudiante = await client.query(`
      UPDATE Tickets 
      SET IdEstudiante = COALESCE(
        (SELECT IdEstudiante FROM Estudiante WHERE IdUsuario = (SELECT IdUsuario FROM Usuarios WHERE CorreoInstitucional = 'sgomar@miumg.edu.gt') LIMIT 1),
        (SELECT IdEstudiante FROM Estudiante LIMIT 1)
      )
      WHERE IdEstudiante IS NULL
      RETURNING IdTicket
    `)

    // 4. Vincular tickets huérfanos sin agente (IdAgente IS NULL) según tipología
    const repairTicketsAgente = await client.query(`
      UPDATE Tickets t
      SET IdAgente = a.IdAgente
      FROM Agentes a
      WHERE t.IdAgente IS NULL AND a.Especialidad = t.TipologiaITIL
      RETURNING t.IdTicket
    `)

    // 5. Vincular estados de ticket huérfanos
    const repairEstadosTicket = await client.query(`
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
      RETURNING e.IdEstado
    `)

    await client.query('COMMIT')

    return {
      estudiantesReparados: repairEstudiantes.rowCount,
      agentesReparados: repairAgentes.rowCount,
      ticketsVinculadosEstudiante: repairTicketsEstudiante.rowCount,
      ticketsVinculadosAgente: repairTicketsAgente.rowCount,
      estadosReparados: repairEstadosTicket.rowCount
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket, repairDatabase }