const { pool } = require('../config/db')

const crearTicket = async ({ tipologiaITIL, descripcion, carnetEstudiante, idUsuario, rol }) => {
  let idEstudiante
  
  if (rol === 'Estudiante') {
    console.log('Creando ticket para estudiante con usuario', idUsuario);
    const est = await pool.query(
      `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuario]
    )
    if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
    idEstudiante = est.rows[0].idestudiante
  } else if (rol === 'Agente') {
    console.log('Creando ticket para estudiante con carnet', carnetEstudiante, 'por agente');
    // Buscar el estudiante por carnet y obtener idestudiante e idusuario
    const est = await pool.query(
      `SELECT idestudiante, idusuario FROM estudiante WHERE carne = $1`, [carnetEstudiante]
    )
    if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
    idEstudiante = est.rows[0].idestudiante
    idUsuario = est.rows[0].idusuario
  }

  console.log('Estudiante encontrado para usuario', idUsuario, ':', idEstudiante);
  
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
    const idAgente = agente.rows.length > 0 ? agente.rows[0].idagente : null

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
    console.log(`
      Ticket ${idTicket} creado:
        ${
          'ID:' + ticket.idTicket,
          'Tipología:' + tipologiaITIL,
          'Descripción:' + descripcion,
          'Prioridad SLA:' + prioridad,
          'Estado:' + 'Abierto',
          'Agente asignado:' + (idAgente ? `Agente ID ${idAgente}` : 'No hay agente disponible para esta tipología')
        }
      `);
    console.log('Ticket asignado al agente:', idAgente ? `Agente ID ${idAgente}` : 'No hay agente disponible para esta tipología');

    return { idTicket, tipologiaITIL, descripcion, prioridadSLA: prioridad, estado: 'Abierto', idAgente}

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const obtenerTicketsEstudiante = async (idUsuario) => {
  console.log('Usuario', idUsuario);
  
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuario]
  )
  if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')

    console.log('Usuario', idUsuario);

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

  console.log('Tickets encontrados:', result.rows)

  return result.rows.map(t => ({
    idTicket:     t.idticket,
    fechaCreacion: t.fechacreacion,
    prioridadSLA: t.prioridadsla,
    tipologiaITIL: t.tipologiaitil,
    estado:       t.estado,
    descripcion:  t.descripcion,
    ultimoEstado: t.ultimoestado
  }))
}

const obtenerUltimoTicket = async (idUsuario) => {
  console.log('Usuario', idUsuario);
  
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuario]
  )
  if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idestudiante = $1
     ORDER BY fechacreacion DESC LIMIT 1`,
    [est.rows[0].idestudiante]
  )

  console.log('Tickets encontrados:', result.rows)

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

const obtenerDetalleTicket = async (idTicket) => {
  const ticket = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion, idestudiante, idagente
     FROM tickets
     WHERE idticket = $1`,
    [idTicket]
  );

  console.log('Ticket obtenido:', ticket.rows);
  
  if (ticket.rows.length === 0) throw new Error('TICKET_NO_ENCONTRADO');
  const t = ticket.rows[0];
  
  const historial = await pool.query(
    `SELECT nombreestado, fechacambio, comentariotecnico
     FROM estadosticket
     WHERE idticket = $1
     ORDER BY fechacambio DESC`,
    [idTicket]
  );
  
  const horasLimite = t.prioridadsla === 'Alta' ? 4 
    : t.prioridadsla === 'Media' ? 24 : 48;
  const fechaCreacion = new Date(t.fechacreacion);
  const fechaLimite = new Date(fechaCreacion.getTime() + horasLimite * 60 * 60 * 1000);
  const ahora = new Date();
  const horasRestantes = Math.max(0, Math.round((fechaLimite - ahora) / (1000 * 60 * 60) * 10) / 10);
  const vencido = ahora > fechaLimite;
  
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
  });

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
  };
}

const cambiarEstadoTicket = async (idTicket, nuevoEstado, comentario) => {
  const estadosValidos = ['Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'];
  if (!estadosValidos.includes(nuevoEstado)) throw new Error('ESTADO_INVALIDO');

  const client = await pool.connect();
  try {
    console.log(`Cambiando estado del ticket ${idTicket}`);

    await client.query('BEGIN');

    await client.query(
      `UPDATE tickets SET estado = $1 WHERE idticket = $2`,
      [nuevoEstado, idTicket]
    );

    console.log(`Estado del ticket ${idTicket} actualizado a ${nuevoEstado}`);

    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
       VALUES ($1, NOW(), $2, $3)`,
      [nuevoEstado, comentario, idTicket]
    );

    console.log(`Historial del ticket ${idTicket} actualizado`);

    await client.query('COMMIT');
    return { idTicket, nuevoEstado };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al cambiar el estado del ticket ${idTicket}:`, err, 'Realizando ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket, obtenerDetalleTicket, cambiarEstadoTicket }