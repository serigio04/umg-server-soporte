const ticketService = require('../services/ticket.service');

const crearTicket = async (req, res) => {
    const { tipologiaITIL, descripcion, } = req.body;
    const idEstudiante = req.usuario.idUsuario;

    if (!tipologiaITIL || !descripcion) 
        return res.status(400).json({ message: 'Tipología ITIL y descripción son requeridos' });

    try {
        const ticket = await ticketService.crearTicket({ tipologiaITIL, descripcion, idEstudiante});
        res.status(201).json({ message: 'Ticket creado', ticket});
    } catch (err) {
        console.error('Error creando ticket:', err);
        res.status(500).json({ message: 'Error del servidor'});
    };
};

const obtenerMisTickets = async (req, res) => {
  try {
    const tickets = await ticketService.obtenerTicketsEstudiante(req.usuario.idUsuario)
    res.json(tickets)
  } catch (err) {
    console.error('Error obteniendo tickets:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerUltimoTicket = async (req, res) => {
  try {
    const ticket = await ticketService.obtenerUltimoTicket(req.usuario.idUsuario)
    res.json(ticket) // null si no tiene tickets
  } catch (err) {
    console.error('Error obteniendo último ticket:', err)
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