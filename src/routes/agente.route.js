const express = require('express');
const router = express.Router();
const agenteController = require('../controllers/agente.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

router.get('/perfil',                         verificarToken, soloRol('Agente', 'Coordinador'), agenteController.obtenerPerfil)
router.get('/:idAgente/ticket-prioridad',     verificarToken, soloRol('Agente', 'Coordinador'), agenteController.obtenerTicketPrioridad)
router.get('/:idAgente/tickets',              verificarToken, soloRol('Agente', 'Coordinador'), agenteController.obtenerTicketsAsignados)

module.exports = router