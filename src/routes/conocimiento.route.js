const express = require('express');
const router = express.Router();
const conocimientoController = require('../controllers/conocimiento.controller');
const { verificarToken, soloRol } = require('../middlewares/auth.middleware');

// Rutas públicas (Estudiantes o acceso libre de solo lectura)
router.get('/', conocimientoController.getArticulos);
router.get('/:idArticulo', conocimientoController.getArticuloById);

// Rutas restringidas (Solo Agentes y Coordinadores)
router.post('/', verificarToken, soloRol('Agente', 'Coordinador'), conocimientoController.createArticulo);
router.put('/:idArticulo', verificarToken, soloRol('Agente', 'Coordinador'), conocimientoController.updateArticulo);
router.delete('/:idArticulo', verificarToken, soloRol('Agente', 'Coordinador'), conocimientoController.deleteArticulo);

module.exports = router;
