const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

// Ruta de reparación (sin autenticación, solo para mantenimiento)
// router.get('/repair-all', ticketController.repairAll)

// Rutas estáticas primero
router.get('/', verificarToken, soloRol('Estudiante'), ticketController.obtenerMisTickets);
router.post('/', verificarToken, soloRol('Estudiante', 'Agente', 'Coordinador'), ticketController.crearTicket);
router.get('/ultimo', verificarToken, soloRol('Estudiante'), ticketController.obtenerUltimoTicket);
router.get('/historial/agente', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.obtenerHistorialAgente);

// Rutas dinámicas después
router.get('/:idTicket', verificarToken, ticketController.obtenerDetalle);
router.put('/:idTicket/estado', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.cambiarEstado);

module.exports = router;
