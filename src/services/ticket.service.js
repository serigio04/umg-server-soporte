const { pool } = require('../config/db')

const crearTicket = async ({ tipologiaITIL, descripcion, idEstudiante }) => {
  const tipologiasValidas = ['Incidente', 'Solicitud', 'Cambio']
  if (!tipologiasValidas.includes(tipologiaITIL)) throw new Error('Tipología inválida')

  const prioridad = tipologiaITIL === 'Incidente' ? 'Alta'
    : tipologiaITIL === 'Solicitud' ? 'Media' : 'Baja'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const agente = await client.query(
      `SELECT IdAgente FROM Agentes WHERE Especialidad = $1 LIMIT 1`,
      [tipologiaITIL]
    )
    const idAgente = agente.rows.length > 0 ? agente.rows[0].IdAgente : null

    const ticket = await client.query(
      `INSERT INTO Tickets (FechaCreacion, PrioridadSLA, TipologiaITIL, Estado, IdEstudiante, Descripcion, IdAgente)
       VALUES (NOW(), $1, $2, 'Abierto', $3, $4, $5)
       RETURNING IdTicket`,
      [prioridad, tipologiaITIL, idEstudiante, descripcion, idAgente]
    )

    const idTicket = ticket.rows[0].IdTicket

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
     WHERE t.IdEstudiante = $1
     ORDER BY t.FechaCreacion DESC`,
    [idEstudiante]
  )

  return result.rows.map(r => ({
    idTicket:     r.IdTicket,
    fechaCreacion: r.FechaCreacion,
    prioridadSLA: r.PrioridadSLA,
    tipologiaITIL: r.TipologiaITIL,
    estado:       r.Estado,
    descripcion:  r.Descripcion,
    ultimoEstado: r.UltimoEstado
  }))
}

const obtenerUltimoTicket = async (idEstudiante) => {
  const result = await pool.query(
    `SELECT IdTicket, FechaCreacion, PrioridadSLA, TipologiaITIL, Estado, Descripcion
     FROM Tickets
     WHERE IdEstudiante = $1
     ORDER BY FechaCreacion DESC LIMIT 1`,
    [idEstudiante]
  )

  if (result.rows.length === 0) return null
  const r = result.rows[0]
  return {
    idTicket:     r.IdTicket,
    fechaCreacion: r.FechaCreacion,
    prioridadSLA: r.PrioridadSLA,
    tipologiaITIL: r.TipologiaITIL,
    estado:       r.Estado,
    descripcion:  r.Descripcion
  }
}

module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket }