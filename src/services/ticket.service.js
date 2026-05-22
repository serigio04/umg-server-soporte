const { pool } = require('../config/db')

const validarEntero = (valor, nombre) => {
  const entero = Number(valor)
  if (!Number.isInteger(entero) || Number.isNaN(entero)) {
    throw new Error(`${nombre}_INVALIDO`)
  }
  return entero
}

const crearTicket = async ({ tipologiaITIL, descripcion, carnetEstudiante, idUsuario, rol }) => {
  let idEstudiante
  
  if (rol === 'Estudiante') {
    const idUsuarioInt = validarEntero(idUsuario, 'ID_USUARIO')
    console.log('Creando ticket para estudiante con usuario', idUsuarioInt);
    const est = await pool.query(
      `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuarioInt]
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

<<<<<<< Updated upstream
    const agente = await client.query(
      `SELECT IdAgente FROM Agentes WHERE Especialidad = $1 LIMIT 1`,
      [tipologiaITIL]
=======
    // Traducir el idUsuario (que viene en el parámetro idEstudiante) al IdEstudiante real
    const estudianteResult = await client.query(
      `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
      [idEstudiante]
    )
    if (estudianteResult.rows.length === 0) throw new Error('Estudiante no encontrado')
    const realIdEstudiante = estudianteResult.rows[0].idestudiante

    const correoMap = {
      'Incidente': 'incidentes@miumg.edu.gt',
      'Solicitud': 'solicitudes@miumg.edu.gt',
      'Cambio': 'cambios@miumg.edu.gt'
    }
    const correoAsignado = correoMap[tipologiaITIL]

    const agente = await client.query(
      `SELECT a.idagente 
       FROM agentes a
       JOIN usuarios u ON a.idusuario = u.idusuario
       WHERE u.correoinstitucional = $1 LIMIT 1`,
      [correoAsignado]
>>>>>>> Stashed changes
    )
    const idAgente = agente.rows.length > 0 ? agente.rows[0].idagente : null

    const ticket = await client.query(
      `INSERT INTO tickets (fechacreacion, prioridadsla, tipologiaitil, estado, idestudiante, descripcion, idagente)
       VALUES (NOW(), $1, $2, 'Abierto', $3, $4, $5)
<<<<<<< Updated upstream
       RETURNING IdTicket`,
      [prioridad, tipologiaITIL, idEstudiante, descripcion, idAgente]
    )

    const idTicket = ticket.rows[0].IdTicket
=======
       RETURNING idticket`,
      [prioridad, tipologiaITIL, realIdEstudiante, descripcion, idAgente]
    )

    const idTicket = ticket.rows[0].idticket
>>>>>>> Stashed changes

    await client.query(
      `INSERT INTO estadosticket (nombreestado, fechacambio, comentariotecnico, idticket)
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
<<<<<<< Updated upstream
  const idUsuarioInt = validarEntero(idUsuario, 'ID_USUARIO')
  console.log('Usuario', idUsuarioInt);
  
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuarioInt]
  )
  if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')

    console.log('Usuario', idUsuario);
=======
  // Primero traducir idUsuario a idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return []
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  const idUsuarioInt = validarEntero(idUsuario, 'ID_USUARIO')
  console.log('Usuario', idUsuarioInt);
  
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1`, [idUsuarioInt]
  )
  if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
=======
  // Primero traducir idUsuario a idEstudiante
  const est = await pool.query(
    `SELECT idestudiante FROM estudiante WHERE idusuario = $1 LIMIT 1`,
    [idUsuario]
  )
  if (est.rows.length === 0) return null
>>>>>>> Stashed changes

  const result = await pool.query(
    `SELECT idticket, fechacreacion, prioridadsla, tipologiaitil, estado, descripcion
     FROM tickets
     WHERE idestudiante = $1
     ORDER BY fechacreacion DESC LIMIT 1`,
    [est.rows[0].idestudiante]
  )

  console.log('Tickets encontrados:', result.rows)

  if (result.rows.length === 0) return null
  const ultimo = result.rows[0]
  return {
    idTicket:     ultimo.idticket,
    fechaCreacion: ultimo.fechacreacion,
    prioridadSLA: ultimo.prioridadsla,
    tipologiaITIL: ultimo.tipologiaitil,
    estado:       ultimo.estado,
    descripcion:  ultimo.descripcion
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
    // 1. Vincular Estudiantes con Usuarios si están huérfanos (IdUsuario IS NULL)
    const repairEstudiantes = await client.query(`
      UPDATE estudiante 
      SET idusuario = u.idusuario
      FROM usuarios u
      WHERE estudiante.idusuario IS NULL 
        AND (
          (estudiante.carne = '99892311043' AND u.correoinstitucional = 'sgomar@miumg.edu.gt') OR
          (estudiante.carne = '99892311044' AND u.correoinstitucional = 'fhipolito@miumg.edu.gt') OR
          (estudiante.carne = '99892311045' AND u.correoinstitucional = 'cdeleon@miumg.edu.gt') OR
          (estudiante.carne = '99892311046' AND u.correoinstitucional = 'ajacinto@miumg.edu.gt')
        )
      RETURNING estudiante.idestudiante
    `)

    // 2. Vincular Agentes con Usuarios si están huérfanos (IdUsuario IS NULL)
    const repairAgentes = await client.query(`
      UPDATE agentes
      SET idusuario = u.idusuario
      FROM usuarios u
      WHERE agentes.idusuario IS NULL
        AND (
          (agentes.especialidad = 'Incidente' AND u.correoinstitucional = 'incidentes@miumg.edu.gt') OR
          (agentes.especialidad = 'Solicitud' AND u.correoinstitucional = 'solicitudes@miumg.edu.gt') OR
          (agentes.especialidad = 'Cambio' AND u.correoinstitucional = 'cambios@miumg.edu.gt') OR
          (agentes.especialidad = 'General' AND u.correoinstitucional = 'coordinador@miumg.edu.gt')
        )
      RETURNING agentes.idagente
    `)

    // 3. Vincular tickets huérfanos sin estudiante
    const repairTicketsEstudiante = await client.query(`
      UPDATE tickets 
      SET idestudiante = COALESCE(
        (SELECT idestudiante FROM estudiante WHERE idusuario = (SELECT idusuario FROM usuarios WHERE correoinstitucional = 'sgomar@miumg.edu.gt') LIMIT 1),
        (SELECT idestudiante FROM estudiante LIMIT 1)
      )
      WHERE idestudiante IS NULL
      RETURNING idticket
    `)

    // 4. Vincular tickets huérfanos sin agente según tipología
    const repairTicketsAgente = await client.query(`
      UPDATE tickets t
      SET idagente = a.idagente
      FROM agentes a
      WHERE t.idagente IS NULL AND a.especialidad = t.tipologiaitil
      RETURNING t.idticket
    `)

    // 5. Vincular estados de ticket huérfanos
    const repairEstadosTicket = await client.query(`
      UPDATE estadosticket e
      SET idticket = sub.idticket
      FROM (
        SELECT 
          est_state.idestado,
          t.idticket
        FROM (
          SELECT idticket, row_number() OVER (ORDER BY idticket) as rn FROM tickets
        ) t
        JOIN (
          SELECT idestado, row_number() OVER (ORDER BY idestado) as rn FROM estadosticket WHERE idticket IS NULL
        ) est_state ON t.rn = est_state.rn
      ) sub
      WHERE e.idestado = sub.idestado
      RETURNING e.idestado
    `)
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket, obtenerDetalleTicket, cambiarEstadoTicket }
=======
module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket, obtenerDetalleTicket, cambiarEstadoTicket, repairDatabase }
>>>>>>> Stashed changes
