const ticketService = require('../services/ticket.service')

const crearTicket = async (req, res) => {
  const { tipologiaITIL, descripcion, idEstudiante } = req.body
  const { rol, idUsuario } = req.usuario
  
  if (!tipologiaITIL || !descripcion)
    return res.status(400).json({ message: 'Tipología y descripción son requeridos' })
  
  // Si es estudiante, crea para sí mismo. Si es agente, debe especificar el estudiante
  if (rol === 'Agente' && !idEstudiante)
    return res.status(400).json({ message: 'Como agente, debe especificar idEstudiante' })
  
  try {
    const ticket = await ticketService.crearTicket({ 
      tipologiaITIL, 
      descripcion, 
      idUsuario: rol === 'Estudiante' ? idUsuario : null,
      idEstudiante: rol === 'Agente' ? idEstudiante : null,
      rol
    })
    res.status(201).json({ message: 'Ticket creado exitosamente', ticket })
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Estudiante no encontrado' })
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
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket }