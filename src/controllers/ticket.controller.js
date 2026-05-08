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

module.exports = { crearTicket, obtenerMisTickets, obtenerUltimoTicket }