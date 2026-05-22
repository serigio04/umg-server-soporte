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

const repairAll = async (req, res) => {
  try {
    const report = await ticketService.repairDatabase()
    res.json({
      status: 'success',
      message: 'Base de datos reparada con éxito. Todos los tickets existentes han sido vinculados correctamente.',
      details: report
    })
  } catch (err) {
    console.error('Error reparando base de datos:', err)
    res.status(500).json({ status: 'error', message: 'Error interno del servidor al reparar la base de datos' })
  }
}

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket, repairAll }
const obtenerDetalle = async (req, res) => {
  const { idTicket } = req.params
  
  try {
    const ticket = await ticketService.obtenerDetalleTicket(idTicket);
    res.status(200).json(ticket);
  } catch (err) {
    if (err.message === 'TICKET_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Ticket no encontrado' });
    console.error('Error:', err);
    res.status(500).json({ message: 'Error interno' });
  }
};

const cambiarEstado = async (req, res) => {
  const { idTicket } = req.params;
  const { nuevoEstado, comentario } = req.body;
  
  if (!nuevoEstado) return res.status(400).json({ message: 'Estado requerido' });
  
  try {
    const resultado = await ticketService.cambiarEstadoTicket(idTicket, nuevoEstado, comentario || '');
    res.json(resultado);
  } catch (err) {
    if (err.message === 'ESTADO_INVALIDO');
      return res.status(400).json({ message: 'Estado inválido' });
    console.error('Error:', err);
    res.status(500).json({ message: 'Error interno' });
  }
};

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket, obtenerDetalle, cambiarEstado }
