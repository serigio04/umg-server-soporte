const { pool } = require('../config/db')

// ─── obtenerPerfilAgente ──────────────────────────────────────────────────────
const obtenerPerfilAgente = async (idUsuario) => {
  const result = await pool.query(
    `SELECT a.idagente, a.especialidad, a.nivelacceso, a.sedeasignada,
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
    sedeAsignada:        r.sedeasignada,
    nombreCompleto:      r.nombrecompleto,
    correoInstitucional: r.correoinstitucional,
    rol:                 r.rol,
    esGerencial:         r.nivelacceso >= 3
  }
}

// ─── obtenerTicketPrioridad ───────────────────────────────────────────────────
const obtenerTicketPrioridad = async (idAgente) => {
  const result = await pool.query(
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
     LIMIT 1`,
    [idAgente]
  );

  console.log('Ticket de prioridad encontrado:', result.rows);

  if (result.rows.length === 0) return null;
  const ticket = result.rows[0];

  return {
    idTicket:      ticket.idticket,
    fechaCreacion: ticket.fechacreacion,
    prioridadSLA:  ticket.prioridadsla,
    tipologiaITIL: ticket.tipologiaitil,
    estado:        ticket.estado,
    descripcion:   ticket.descripcion,
    carne:         ticket.carne
  };
};

// ─── obtenerTicketsAsignados ──────────────────────────────────────────────────
const obtenerTicketsAsignados = async (idAgente) => {
  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idagente = $1
     ORDER BY fechacreacion DESC`,
    [idAgente]
  )

  return result.rows.map(r => ({
    idTicket:      r.idticket,
    fechaCreacion: r.fechacreacion,
    prioridadSLA:  r.prioridadsla,
    tipologiaITIL: r.tipologiaitil,
    estado:        r.estado,
    descripcion:   r.descripcion
  }))
}

module.exports = { obtenerPerfilAgente, obtenerTicketPrioridad, obtenerTicketsAsignados }