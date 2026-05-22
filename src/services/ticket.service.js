const { pool } = require('../config/db')

const validarEntero = (valor, nombre) => {
  const entero = Number(valor)
  if (!Number.isInteger(entero) || Number.isNaN(entero)) {
    throw new Error(`${nombre}_INVALIDO`)
  }
  return entero
}
// ─── crearTicket ────────────────────────────────────────────────────────────
const crearTicket = async ({ tipologiaITIL, descripcion, carnetEstudiante, idUsuario, rol }) => {
  const tipologiasValidas = ['Incidente', 'Solicitud', 'Cambio']
  if (!tipologiasValidas.includes(tipologiaITIL)) throw new Error('Tipología inválida')

  const prioridad = tipologiaITIL === 'Incidente' ? 'Alta'
    : tipologiaITIL === 'Solicitud' ? 'Media' : 'Baja'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Obtener el idEstudiante real según el rol
    let idEstudiante
    if (rol === 'Estudiante') {
      const est = await client.query(
        `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
        [idUsuario]
      )
      if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
      idEstudiante = est.rows[0].idestudiante
    } else {
      // Agente crea el ticket buscando al estudiante por carnet
      const est = await client.query(
        `SELECT idestudiante FROM estudiante WHERE carne = $1 LIMIT 1`,
        [carnetEstudiante]
      )
      if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
      idEstudiante = est.rows[0].idestudiante
    }

    console.log('idEstudiante resuelto:', idEstudiante)

    // Buscar el agente asignado según la tipología (por correo institucional)
    const correoMap = {
      'Incidente': 'incidentes@miumg.edu.gt',
      'Solicitud':  'solicitudes@miumg.edu.gt',
      'Cambio':     'cambios@miumg.edu.gt'
    }
    const agente = await client.query(
      `SELECT a.idagente
       FROM agentes a
       JOIN usuarios u ON a.idusuario = u.idusuario
       WHERE u.correoinstitucional = $1 LIMIT 1`,
      [correoMap[tipologiaITIL]]
    )
    const idAgente = agente.rows.length > 0 ? agente.rows[0].idagente : null
    console.log('idAgente asignado:', idAgente)

    // Insertar el ticket
    const ticketResult = await client.query(
      `INSERT INTO tickets (fechacreacion, prioridadsla, tipologiaitil, estado, idestudiante, descripcion, idagente)
       VALUES (NOW(), $1, $2, 'Abierto', $3, $4, $5)
       RETURNING idticket`,
      [prioridad, tipologiaITIL, idEstudiante, descripcion, idAgente]
    )
    const idTicket = ticketResult.rows[0].idticket

    // Insertar el estado inicial
    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ('Abierto', NOW(), 'Ticket creado', $1)`,
      [idTicket]
    )

    await client.query('COMMIT')
    console.log(`Ticket ${idTicket} creado. Agente: ${idAgente ?? 'ninguno'}`)
    return { idTicket, tipologiaITIL, descripcion, prioridadSLA: prioridad, estado: 'Abierto', idAgente }

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── obtenerTicketsEstudiante ────────────────────────────────────────────────
const obtenerTicketsEstudiante = async (idUsuario) => {
  // Traducir idUsuario → idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return []

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion,
       (SELECT e.nombreestado FROM estadosticket e
        WHERE e.idticket = t.idticket
        ORDER BY e.fechacambio DESC LIMIT 1) AS ultimoestado
     FROM tickets t
     WHERE t.idestudiante = $1
     ORDER BY t.fechacreacion DESC`,
    [est.rows[0].idestudiante]
  )

  console.log('Tickets encontrados:', result.rows.length)

  return result.rows.map(t => ({
    idTicket:      t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA:  t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado:        t.estado,
    descripcion:   t.descripcion,
    ultimoEstado:  t.ultimoestado
  }))
}

// ─── obtenerUltimoTicket ─────────────────────────────────────────────────────
const obtenerUltimoTicket = async (idUsuario) => {
  // Traducir idUsuario → idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return null

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idestudiante = $1
     ORDER BY fechacreacion DESC LIMIT 1`,
    [est.rows[0].idestudiante]
  )

  if (result.rows.length === 0) return null
  const t = result.rows[0]
  return {
    idTicket:      t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA:  t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado:        t.estado,
    descripcion:   t.descripcion
  }
}

// ─── obtenerDetalleTicket ────────────────────────────────────────────────────
const obtenerDetalleTicket = async (idTicket) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET')
  const ticketRes = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion, idestudiante, idagente
     FROM tickets
     WHERE idticket = $1`,
    [idTicketInt]
  )

  if (ticketRes.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO')
  const t = ticketRes.rows[0]

  const historial = await pool.query(
    `SELECT nombreestado, fechacambio, comentariotecnico
     FROM estadosticket
     WHERE idticket = $1
     ORDER BY fechacambio DESC`,
    [idTicketInt]
  )

  const horasLimite = t.prioridadsla === 'Alta' ? 4
    : t.prioridadsla === 'Media' ? 24 : 48
  const fechaCreacion = new Date(t.fechacreacion)
  const fechaLimite = new Date(fechaCreacion.getTime() + horasLimite * 60 * 60 * 1000)
  const ahora = new Date()
  const horasRestantes = Math.max(0, Math.round((fechaLimite - ahora) / (1000 * 60 * 60) * 10) / 10)
  const vencido = ahora > fechaLimite

  console.log('Detalle del ticket:', {
    idTicket: t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado: t.estado,
    descripcion: t.descripcion,
    idEstudiante: t.idestudiante,
    idAgente: t.idagente,
    horasRestantes,
    vencido,
    historial: historial.rows
  })

  return {
    idTicket: t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado: t.estado,
    descripcion: t.descripcion,
    idEstudiante: t.idestudiante,
    idAgente: t.idagente,
    horasRestantes,
    vencido,
    historial: historial.rows.map(h => ({
      estado: h.nombreestado,
      fecha: h.fechacambio,
      comentario: h.comentariotecnico
    }))
  }
}

// ─── cambiarEstadoTicket ─────────────────────────────────────────────────────
const cambiarEstadoTicket = async (idTicket, nuevoEstado, comentario) => {
  const idTicketInt = validarEntero(idTicket, 'ID_TICKET');
  const estadosValidos = ['Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'];
  if (!estadosValidos.includes(nuevoEstado)) throw new Error('ESTADO_INVALIDO');

  const client = await pool.connect()
  try {
    console.log(`Cambiando estado del ticket ${idTicketInt}`);

    await client.query('BEGIN');

    await client.query(
      `UPDATE tickets SET estado = $1 WHERE idticket = $2`,
      [nuevoEstado, idTicketInt]
    );

    console.log(`Estado del ticket ${idTicketInt} actualizado a ${nuevoEstado}`);

    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ($1, NOW(), $2, $3)`,
      [nuevoEstado, comentario, idTicketInt]
    );

    await client.query('COMMIT');
    
    console.log(`Historial del ticket ${idTicketInt} actualizado`);
    
    return { idTicket: idTicketInt, nuevoEstado };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al cambiar el estado del ticket ${idTicketInt}:`, err, 'Realizando ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const obtenerHistorialTicketsAgente = async (idAgente) => {
  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idagente = $1 AND estado != 'Abierto'
     ORDER BY fechacreacion DESC`,
    [idAgente]
  );
  
  return result.rows.map(t => ({
    idTicket: t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado: t.estado,
    descripcion: t.descripcion
  }));
};

  const escalarTicket = async (idTicket, idAgenteActual) => {
    const coordinador = await pool.query(
      `SELECT a.idagente FROM agentes a
      JOIN usuarios u ON u.idusuario = a.idusuario
      WHERE u.rol = 'Coordinador' LIMIT 1`
    )
    
    if (coordinador.rows.length === 0) throw new Error('COORDINADOR_NO_ENCONTRADO')
    
    const idCoordinador = coordinador.rows[0].idagente
    
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        `UPDATE tickets SET idagente = $1 WHERE idticket = $2`,
        [idCoordinador, idTicket]
      )

      await client.query(
        `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
        VALUES ($1, NOW(), $2, $3)`,
        ['Escalado', `Ticket escalado al coordinador por agente ${idAgenteActual}`, idTicket]
      )

      await client.query('COMMIT')
      return { idTicket, nuevoAgente: idCoordinador, estado: 'Escalado' }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

module.exports = { 
  crearTicket, 
  obtenerTicketsEstudiante, 
  obtenerUltimoTicket, 
  obtenerDetalleTicket, 
  cambiarEstadoTicket,
  escalarTicket,
  obtenerHistorialTicketsAgente
}