const { pool } = require('../config/db')
const ticketService = require('../services/ticket.service')

const crearTicket = async (req, res) => {
  const { tipologiaITIL, descripcion, carnetEstudiante } = req.body
  
  if (!tipologiaITIL || !descripcion)
    return res.status(400).json({ message: 'Tipología y descripción son requeridos' })

  try {
    let carnet = carnetEstudiante
    let idUsuario = req.usuario.idUsuario
    
    if (req.usuario.rol === 'Estudiante') {
      const est = await pool.query(
        `SELECT carne FROM estudiante WHERE idusuario = $1`, [req.usuario.idUsuario]
      )
      if (est.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO')
      carnet = est.rows[0].carne
    } else if (!carnetEstudiante) {
      return res.status(400).json({ message: 'Se requiere carnet del estudiante para agentes' })
    }

    const ticket = await ticketService.crearTicket({ 
      tipologiaITIL, 
      descripcion, 
      carnetEstudiante: carnet,
      idUsuario,
      rol: req.usuario.rol
    })
    res.status(201).json({ message: 'Ticket creado exitosamente', ticket })
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Estudiante no encontrado' })
    if (err.message === 'ID_USUARIO_INVALIDO')
      return res.status(400).json({ message: 'ID de usuario inválido' })
    console.error('Error creando ticket:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerMisTickets = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerTicketsEstudiante(req.usuario.idUsuario)
    res.json(tickets)
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Estudiante no encontrado' })
    if (err.message === 'ID_USUARIO_INVALIDO')
      return res.status(400).json({ message: 'ID de usuario inválido' })
    res.status(500).json({ message: 'Error interno' })
  }
}

const obtenerUltimoTicket = async (req, res) => {
  try {
    const ticket = await ticketService.obtenerUltimoTicket(req.usuario.idUsuario)
    res.json(ticket)
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Estudiante no encontrado' })
    if (err.message === 'ID_USUARIO_INVALIDO')
      return res.status(400).json({ message: 'ID de usuario inválido' })
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerDetalle = async (req, res) => {
  const { idTicket } = req.params
  
  try {
    const idTicketInt = Number(idTicket);
    if (!Number.isInteger(idTicketInt) || Number.isNaN(idTicketInt)) {
      return res.status(400).json({ message: 'ID de ticket inválido' });
    }
    const ticket = await ticketService.obtenerDetalleTicket(idTicketInt);
    res.status(200).json(ticket);
  } catch (err) {
    if (err.message === 'TICKET_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Ticket no encontrado' });
    if (err.message === 'ID_TICKET_INVALIDO')
      return res.status(400).json({ message: 'ID de ticket inválido' });
    console.error('Error:', err);
    res.status(500).json({ message: 'Error interno' });
  }
};

const cambiarEstado = async (req, res) => {
  const { idTicket } = req.params;
  const { nuevoEstado, comentario } = req.body;
  
  if (!nuevoEstado) return res.status(400).json({ message: 'Estado requerido' });
  
  try {
    const idTicketInt = Number(idTicket);
    if (!Number.isInteger(idTicketInt) || Number.isNaN(idTicketInt)) {
      return res.status(400).json({ message: 'ID de ticket inválido' });
    }
    const resultado = await ticketService.cambiarEstadoTicket(idTicketInt, nuevoEstado, comentario || '');
    res.json(resultado);
  } catch (err) {
    if (err.message === 'ESTADO_INVALIDO')
      return res.status(400).json({ message: 'Estado inválido' });    if (err.message === 'ID_TICKET_INVALIDO')
      return res.status(400).json({ message: 'ID de ticket inválido' });    console.error('Error:', err);
    res.status(500).json({ message: 'Error interno' });
  }
};

const obtenerHistorialAgente = async (req, res) => {
  try {
    const agente = await pool.query(
      `SELECT idagente FROM agentes WHERE idusuario = $1`,
      [req.usuario.idUsuario]
    );
    if (agente.rows.length === 0)
      return res.status(404).json({ message: 'Agente no encontrado' });
    
    const historial = await ticketService.obtenerHistorialTicketsAgente(agente.rows[0].idagente);
    res.json(historial);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Error interno' });
  };
};

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket, obtenerDetalle, cambiarEstado, obtenerHistorialAgente }