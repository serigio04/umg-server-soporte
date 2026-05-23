const { pool } = require('../config/db')

const crearEncuesta = async (idTicket, idEstudiante) => {
  const result = await pool.query(
    `INSERT INTO encuestas (idticket, idestudiante, fechacreacion)
     VALUES ($1, $2, NOW())
     RETURNING idencuesta`,
    [idTicket, idEstudiante]
  )
  return result.rows[0].idencuesta
}

const enviarEncuesta = async (idEncuesta, calificacion, comentario) => {
  if (calificacion < 1 || calificacion > 5) throw new Error('CALIFICACION_INVALIDA')
  
  await pool.query(
    `UPDATE encuestas 
     SET calificacion = $1, comentario = $2, fecharespuesta = NOW()
     WHERE idencuesta = $3`,
    [calificacion, comentario, idEncuesta]
  )
}

const obtenerEncuestaPorTicket = async (idTicket) => {
  const result = await pool.query(
    `SELECT idencuesta FROM encuestas 
     WHERE idticket = $1 AND fecharespuesta IS NULL LIMIT 1`,
    [idTicket]
  )
  if (result.rows.length === 0) throw new Error('ENCUESTA_NO_ENCONTRADA')
  return result.rows[0]
}

module.exports = { crearEncuesta, enviarEncuesta, obtenerEncuestaPorTicket }