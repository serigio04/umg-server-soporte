const ticketService = require('../services/ticket.service')

// ─── crearTicket ─────────────────────────────────────────────────────────────
const crearTicket = async (req, res) => {
  const { tipologiaITIL, descripcion, carnetEstudiante } = req.body

  if (!tipologiaITIL || !descripcion)
    return res.status(400).json({ message: 'Tipología y descripción son requeridos' })

  try {
    let carnet = carnetEstudiante

    // Si es Estudiante, obtenemos su carnet automáticamente
    if (req.usuario.rol === 'Estudiante') {
      const { pool } = require('../config/db')
      const est = await pool.query(
        `SELECT carne FROM estudiante WHERE idusuario = $1 LIMIT 1`,
        [req.usuario.idUsuario]
      )
      if (est.rows.length === 0) return res.status(404).json({ message: 'Estudiante no encontrado' })
      carnet = est.rows[0].carne
    } else if (!carnetEstudiante) {
      return res.status(400).json({ message: 'Se requiere carnet del estudiante' })
    }

    const ticket = await ticketService.crearTicket({
      tipologiaITIL,
      descripcion,
      carnetEstudiante: carnet,
      idUsuario: req.usuario.idUsuario,
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

// ─── obtenerMisTickets ────────────────────────────────────────────────────────
const obtenerMisTickets = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerTicketsEstudiante(req.usuario.idUsuario)
    res.json(tickets)
  } catch (err) {
    console.error('Error obteniendo tickets:', err)
    res.status(500).json({ message: 'Error interno' })
  }
}

// ─── obtenerUltimoTicket ──────────────────────────────────────────────────────
const obtenerUltimoTicket = async (req, res) => {
  try {
    const ticket = await ticketService.obtenerUltimoTicket(req.usuario.idUsuario)
    res.json(ticket) // null si no tiene tickets
  } catch (err) {
    console.error('Error obteniendo último ticket:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─── obtenerDetalle ───────────────────────────────────────────────────────────
const obtenerDetalle = async (req, res) => {
  const { idTicket } = req.params
  try {
    const ticket = await ticketService.obtenerDetalleTicket(idTicket)
    res.status(200).json(ticket)
  } catch (err) {
    if (err.message === 'TICKET_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Ticket no encontrado' })
    console.error('Error obteniendo detalle:', err)
    res.status(500).json({ message: 'Error interno' })
  }
}

// ─── cambiarEstado ────────────────────────────────────────────────────────────
const cambiarEstado = async (req, res) => {
  const { idTicket } = req.params
  const { nuevoEstado, comentario } = req.body

  if (!nuevoEstado) return res.status(400).json({ message: 'Estado requerido' })

  try {
    const resultado = await ticketService.cambiarEstadoTicket(idTicket, nuevoEstado, comentario || '')
    res.json(resultado)
  } catch (err) {
    if (err.message === 'ESTADO_INVALIDO')
      return res.status(400).json({ message: 'Estado inválido' })
    console.error('Error cambiando estado:', err)
    res.status(500).json({ message: 'Error interno' })
  }
}

// ─── repairAll ────────────────────────────────────────────────────────────────
const repairAll = async (req, res) => {
  try {
    const report = await ticketService.repairDatabase()
    res.json({
      status: 'success',
      message: 'Base de datos reparada con éxito.',
      details: report
    })
  } catch (err) {
    console.error('Error reparando base de datos:', err)
    res.status(500).json({ status: 'error', message: 'Error interno del servidor al reparar la base de datos' })
  }
}

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket, obtenerDetalle, cambiarEstado, repairAll }
