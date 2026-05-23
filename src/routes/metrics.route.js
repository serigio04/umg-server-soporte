const express = require('express')
const router = express.Router()
const metricsController = require('../controllers/metrics.controller')
const { verificarToken, soloRol } = require('../middlewares/auth.middleware')

router.get('/dashboard', verificarToken, soloRol('Coordinador'), metricsController.obtenerDashboardCoordinador)
router.get('/agente/:idAgente', verificarToken, soloRol('Agente', 'Coordinador'), metricsController.obtenerMetricasAgente)
router.get('/reporte-csv', verificarToken, soloRol('Coordinador', 'Agente'), metricsController.descargarReporteCsv)
router.get('/reporte-excel', verificarToken, soloRol('Coordinador'), metricsController.descargarReporteExcel)
router.get('/reporte-calificaciones-excel', verificarToken, soloRol('Coordinador'), metricsController.descargarReporteCalificacionesExcel)

module.exports = router
