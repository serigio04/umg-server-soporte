const { pool } = require('../config/db')

const obtenerPerfilAgente = async (idUsuario) => {
  console.log('Obteniendo perfil para usuario', idUsuario);

  const result = await pool.query(
<<<<<<< Updated upstream
    `SELECT a.idagente, a.especialidad, a.nivelacceso, a.sedeAsignada,
=======
    `SELECT a.idagente, a.especialidad, a.nivelacceso, a.sedeasignada,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    sedeAsignada:        r.sedeAsignada,
=======
    sedeAsignada:        r.sedeasignada,
>>>>>>> Stashed changes
    nombreCompleto:      r.nombrecompleto,
    correoInstitucional: r.correoinstitucional,
    rol:                 r.rol,
    esGerencial:         r.nivelacceso >= 3
  }
}

const obtenerTicketPrioridad = async (idAgente) => {
  console.log('Obteniendo ticket de prioridad para agente', idAgente);

  const result = await pool.query(
<<<<<<< Updated upstream
    `SELECT t.idticket, t.fechacreacion, t.prioridadsla, t.tipologiaitil, t.estado, t.descripcion, t.idestudiante, e.idestudiante, e.carne
     FROM tickets t
     INNER JOIN estudiante e ON e.idestudiante = t.idestudiante
     WHERE t.idagente = $1 AND t.estado = 'Abierto'
     ORDER BY
       CASE
         WHEN t.prioridadsla = 'Alta'  THEN 1
         WHEN t.prioridadsla = 'Media' THEN 2
         WHEN t.prioridadsla = 'Baja'  THEN 3
         ELSE 4
       END ASC,
       t.fechacreacion ASC
=======
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
>>>>>>> Stashed changes
     LIMIT 1`,
    [idAgente]
  );

  console.log('Ticket de prioridad encontrado:', result.rows);

  if (result.rows.length === 0) return null;
  const ticket = result.rows[0];

  return {
<<<<<<< Updated upstream
    idTicket:     ticket.idticket,
    fechaCreacion: ticket.fechacreacion,
    prioridadSLA: ticket.prioridadsla,
    tipologiaITIL: ticket.tipologiaitil,
    estado:       ticket.estado,
    descripcion:  ticket.descripcion,
    carne:        ticket.carne
=======
    idTicket:     r.idticket,
    fechaCreacion: r.fechacreacion,
    prioridadSLA: r.prioridadsla,
    tipologiaITIL: r.tipologiaitil,
    estado:       r.estado,
    descripcion:  r.descripcion
>>>>>>> Stashed changes
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