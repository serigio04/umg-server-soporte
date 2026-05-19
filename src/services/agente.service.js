const { pool } = require('../config/db')

const obtenerPerfilAgente = async (idUsuario) => {
  const result = await pool.query(
    `SELECT a.IdAgente, a.Especialidad, a.NivelAcceso, a.SedeAsignada,
            u.NombreCompleto, u.CorreoInstitucional, u.Rol
     FROM Agentes a
     JOIN Usuarios u ON u.IdUsuario = a.IdUsuario
     WHERE a.IdUsuario = $1`,
    [idUsuario]
  )

  if (result.rows.length === 0) throw new Error('AGENTE_NO_ENCONTRADO')
  const r = result.rows[0]
  return {
    idAgente:            r.IdAgente,
    especialidad:        r.Especialidad,
    nivelAcceso:         r.NivelAcceso,
    sedeAsignada:        r.SedeAsignada,
    nombreCompleto:      r.NombreCompleto,
    correoInstitucional: r.CorreoInstitucional,
    rol:                 r.Rol,
    esGerencial:         r.NivelAcceso >= 3
  }
}

const obtenerTicketPrioridad = async (idAgente) => {
  const result = await pool.query(
    `SELECT IdTicket, FechaCreacion, PrioridadSLA, TipologiaITIL, Estado, Descripcion
     FROM Tickets
     WHERE IdAgente = $1 AND Estado = 'Abierto'
     ORDER BY
       CASE
         WHEN PrioridadSLA = 'Alta'  THEN 1
         WHEN PrioridadSLA = 'Media' THEN 2
         WHEN PrioridadSLA = 'Baja'  THEN 3
         ELSE 4
       END ASC,
       FechaCreacion ASC
     LIMIT 1`,
    [idAgente]
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

const obtenerTicketsAsignados = async (idAgente) => {
  const result = await pool.query(
    `SELECT IdTicket, FechaCreacion, PrioridadSLA, TipologiaITIL, Estado, Descripcion
     FROM Tickets
     WHERE IdAgente = $1
     ORDER BY FechaCreacion DESC`,
    [idAgente]
  )

  return result.rows.map(r => ({
    idTicket:     r.IdTicket,
    fechaCreacion: r.FechaCreacion,
    prioridadSLA: r.PrioridadSLA,
    tipologiaITIL: r.TipologiaITIL,
    estado:       r.Estado,
    descripcion:  r.Descripcion
  }))
}

module.exports = { obtenerPerfilAgente, obtenerTicketPrioridad, obtenerTicketsAsignados }