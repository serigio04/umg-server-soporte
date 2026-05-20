const { pool } = require('../config/db')

const obtenerPerfilAgente = async (idUsuario) => {
  console.log('Obteniendo perfil para usuario', idUsuario);

  const result = await pool.query(
    `SELECT a.idagente, a.especialidad, a.nivelacceso, a.sedeAsignada,
            u.nombrecompleto, u.correoinstitucional, u.rol
     FROM agentes a
     JOIN usuarios u ON u.idusuario = a.idusuario
     WHERE a.idusuario = $1`,
    [idUsuario]
  )
  if (result.rows.length === 0) throw new Error('AGENTE_NO_ENCONTRADO')
  const r = result.rows[0]
  return {
    idAgente:            r.idagente,
    especialidad:        r.especialidad,
    nivelAcceso:         r.nivelacceso,
    sedeAsignada:        r.sedeAsignada,
    nombreCompleto:      r.nombrecompleto,
    correoInstitucional: r.correoinstitucional,
    rol:                 r.rol,
    esGerencial:         r.nivelacceso >= 3
  }
}

const obtenerTicketPrioridad = async (idAgente) => {
  console.log('Obteniendo ticket de prioridad para agente', idAgente);

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idagente = $1 AND estado = 'Abierto'
     ORDER BY
       CASE
         WHEN prioridadsla = 'Alta'  THEN 1
         WHEN prioridadsla = 'Media' THEN 2
         WHEN prioridadsla = 'Baja'  THEN 3
         ELSE 4
       END ASC,
       fechacreacion ASC
     LIMIT 1`,
    [idAgente]
  )
  if (result.rows.length === 0) return null
  const r = result.rows[0]
  return {
    idTicket:     r.idticket,
    fechaCreacion: r.fechacreacion,
    prioridadSLA: r.prioridadsla,
    tipologiaITIL: r.tipologiaitil,
    estado:       r.estado,
    descripcion:  r.descripcion
  }
}

const obtenerTicketsAsignados = async (idAgente) => {
  console.log('Obteniendo tickets asignados para agente', idAgente);

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idagente = $1
     ORDER BY fechacreacion DESC`,
    [idAgente]
  )
  return result.rows.map(r => ({
    idTicket:     r.idticket,
    fechaCreacion: r.fechacreacion,
    prioridadSLA: r.prioridadsla,
    tipologiaITIL: r.tipologiaitil,
    estado:       r.estado,
    descripcion:  r.descripcion
  }))
}

module.exports = { obtenerPerfilAgente, obtenerTicketPrioridad, obtenerTicketsAsignados }