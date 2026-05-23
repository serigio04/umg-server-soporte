const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const { verificarToken, soloRol } = require('../middlewares/auth.middleware')

// Sólo el Coordinador (Agente nivel 3) puede registrar agentes y estudiantes (o según reglas de negocio)
router.post('/agente', verificarToken, soloRol('Coordinador'), userController.registrarAgente)
router.post('/estudiante', verificarToken, soloRol('Coordinador'), userController.registrarEstudiante)
// Endpoint para listar agentes (solo coordinador)
router.get('/agentes', verificarToken, soloRol('Coordinador'), userController.listarAgentes)

// Endpoint para modificar especialidad (solo coordinador)
router.put('/agentes/:idAgente/especialidad', verificarToken, soloRol('Coordinador'), userController.modificarEspecialidad)

// Endpoint para cambiar contraseña (cualquier rol autenticado)
router.put('/password', verificarToken, userController.cambiarPassword)

module.exports = router
