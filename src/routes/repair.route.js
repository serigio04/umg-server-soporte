const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repair.controller');

// Ruta de reparación (sin autenticación, solo para mantenimiento)
router.get('/repair-all', ticketController.repairAll);

module.exports = router;