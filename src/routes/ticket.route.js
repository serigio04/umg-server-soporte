const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, soloRol('Estudiante'), ticketController.obtenerMisTickets)
router.get('/ultimo', verificarToken, soloRol('Estudiante'), ticketController.obtenerUltimoTicket)
router.post('/', verificarToken, soloRol('Estudiante', 'Agente'), ticketController.crearTicket)

module.exports = router;