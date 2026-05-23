const surveyService = require('../services/survey.service')

const enviarEncuesta = async (req, res) => {
  const { idEncuesta } = req.params
  const { calificacion, comentario } = req.body

  if (!calificacion) return res.status(400).json({ message: 'Calificación requerida' })

  try {
    await surveyService.enviarEncuesta(idEncuesta, calificacion, comentario || '')
    res.json({ message: 'Encuesta enviada' })
  } catch (err) {
    if (err.message === 'CALIFICACION_INVALIDA')
      return res.status(400).json({ message: 'Calificación debe ser 1-5' })
    console.error('Error:', err)
    res.status(500).json({ message: 'Error interno' })
  }
}

const obtenerEncuestaPorTicket = async (req, res) => {
  const { idTicket } = req.params

  try {
    const encuesta = await surveyService.obtenerEncuestaPorTicket(idTicket)
    res.json(encuesta)
  } catch (err) {
    if (err.message === 'ENCUESTA_NO_ENCONTRADA')
      return res.status(404).json({ message: 'Encuesta no encontrada' })
    console.error('Error:', err)
    res.status(500).json({ message: 'Error interno' })
  }
}

module.exports = { enviarEncuesta, obtenerEncuestaPorTicket }