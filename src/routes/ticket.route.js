const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticket.controller')
const { verificarToken, soloRol } = require('../middlewares/auth.middleware')

// Ruta de reparación (sin autenticación, solo para mantenimiento)
router.get('/repair-all', ticketController.repairAll)

// Rutas estáticas PRIMERO (antes de /:idTicket para que Express no las capture como parámetro)
router.get('/',       verificarToken, soloRol('Estudiante'),           ticketController.obtenerMisTickets)
router.get('/ultimo', verificarToken, soloRol('Estudiante'),           ticketController.obtenerUltimoTicket)
router.post('/',      verificarToken, soloRol('Estudiante', 'Agente'), ticketController.crearTicket)

// Rutas dinámicas con parámetro (al final)
router.get('/:idTicket',        verificarToken,                              ticketController.obtenerDetalle)
router.put('/:idTicket/estado', verificarToken, soloRol('Agente', 'Coordinador'), ticketController.cambiarEstado)

module.exports = router