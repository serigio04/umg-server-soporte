const agenteService = require('../services/agente.service')

const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await agenteService.obtenerPerfilAgente(req.usuario.idUsuario)
    res.json(perfil)
  } catch (err) {
    if (err.message === 'AGENTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Agente no encontrado' })
    console.error('Error obteniendo perfil agente:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerTicketPrioridad = async (req, res) => {
  try {
    const { idAgente } = req.params
    const ticket = await agenteService.obtenerTicketPrioridad(idAgente)
    res.json(ticket)
  } catch (err) {
    console.error('Error obteniendo ticket prioridad:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerTicketsAsignados = async (req, res) => {
  try {
    const { idAgente } = req.params
    const tickets = await agenteService.obtenerTicketsAsignados(idAgente)
    res.json(tickets)
  } catch (err) {
    console.error('Error obteniendo tickets asignados:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { obtenerPerfil, obtenerTicketPrioridad, obtenerTicketsAsignados }