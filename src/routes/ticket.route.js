const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

<<<<<<< Updated upstream
router.get('/:idTicket', verificarToken, ticketController.obtenerDetalle);
router.put('/:idTicket/estado', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.cambiarEstado);
router.get('/', verificarToken, soloRol('Estudiante'), ticketController.obtenerMisTickets);
router.get('/ultimo', verificarToken, soloRol('Estudiante'), ticketController.obtenerUltimoTicket);
router.post('/', verificarToken, soloRol('Estudiante', 'Agente'), ticketController.crearTicket);
=======
// Ruta de reparación (sin autenticación, solo para mantenimiento)
router.get('/repair-all', ticketController.repairAll)

// Rutas estáticas primero (IMPORTANTE: antes de /:idTicket para que no las capture)
router.get('/', verificarToken, soloRol('Estudiante'), ticketController.obtenerMisTickets);
router.get('/ultimo', verificarToken, soloRol('Estudiante'), ticketController.obtenerUltimoTicket);
router.post('/', verificarToken, soloRol('Estudiante', 'Agente'), ticketController.crearTicket);

// Rutas dinámicas con parámetro (al final)
router.get('/:idTicket', verificarToken, ticketController.obtenerDetalle);
router.put('/:idTicket/estado', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.cambiarEstado);
>>>>>>> Stashed changes

module.exports = router;