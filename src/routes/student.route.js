const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

router.get('/perfil', verificarToken, soloRol('Estudiante'), studentController.obtenerPerfil);
router.get('/:carne', verificarToken, soloRol('Estudiante'), studentController.obtenerPorCarne);

module.exports = router