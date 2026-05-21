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