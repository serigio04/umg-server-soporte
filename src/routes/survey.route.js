const express = require('express')
const router = express.Router()
const surveyController = require('../controllers/survey.controller')
const { verificarToken } = require('../middlewares/auth.middleware')

router.post('/:idEncuesta/responder', verificarToken, surveyController.enviarEncuesta)
router.get('/ticket/:idTicket', verificarToken, surveyController.obtenerEncuestaPorTicket)

module.exports = router