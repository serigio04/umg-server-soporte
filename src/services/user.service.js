const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

const crearAgente = async ({ nombreCompleto, correoInstitucional, password, especialidad, nivelAcceso, sedeAsignada }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash(password, 10)

    const userResult = await client.query(
      `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
       VALUES ($1, $2, $3, 'Agente')
       RETURNING idusuario`,
      [nombreCompleto, correoInstitucional, hash]
    )
    const idUsuario = userResult.rows[0].idusuario

    const agenteResult = await client.query(
      `INSERT INTO agentes (especialidad, nivelacceso, sedeasignada, idusuario)
       VALUES ($1, $2, $3, $4)
       RETURNING idagente`,
      [especialidad, nivelAcceso, sedeAsignada, idUsuario]
    )

    await client.query('COMMIT')
    return { idUsuario, idAgente: agenteResult.rows[0].idagente, nombreCompleto, correoInstitucional }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const crearEstudiante = async ({ nombreCompleto, correoInstitucional, password, carne, carrera }) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash(password, 10)

    const userResult = await client.query(
      `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
       VALUES ($1, $2, $3, 'Estudiante')
       RETURNING idusuario`,
      [nombreCompleto, correoInstitucional, hash]
    )
    const idUsuario = userResult.rows[0].idusuario

    const estudianteResult = await client.query(
      `INSERT INTO estudiante (carne, carrera, saldoactual, idusuario)
       VALUES ($1, $2, 0, $3)
       RETURNING idestudiante`,
      [carne, carrera, idUsuario]
    )

    await client.query('COMMIT')
    return { idUsuario, idEstudiante: estudianteResult.rows[0].idestudiante, nombreCompleto, correoInstitucional, carne }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const listarAgentes = async () => {
  const result = await pool.query(
    `SELECT a.idagente, a.especialidad, a.nivelacceso, a.sedeasignada, u.nombrecompleto, u.correoinstitucional
     FROM agentes a
     JOIN usuarios u ON a.idusuario = u.idusuario
     WHERE u.rol = 'Agente'`
  )
  return result.rows
}

const actualizarEspecialidadAgente = async (idAgente, nuevaEspecialidad) => {
  const result = await pool.query(
    `UPDATE agentes
     SET especialidad = $1
     WHERE idagente = $2
     RETURNING idagente`,
    [nuevaEspecialidad, idAgente]
  )
  if (result.rows.length === 0) throw new Error('AGENTE_NO_ENCONTRADO')
  return { success: true }
}

const cambiarPasswordUsuario = async (idUsuario, passwordActual, passwordNueva) => {
  const result = await pool.query(`SELECT passwordhash FROM usuarios WHERE idusuario = $1`, [idUsuario])
  if (result.rows.length === 0) throw new Error('USUARIO_NO_ENCONTRADO')

  const hashActual = result.rows[0].passwordhash
  const match = await bcrypt.compare(passwordActual, hashActual)
  if (!match) throw new Error('PASSWORD_INCORRECTA')

  const hashNueva = await bcrypt.hash(passwordNueva, 10)
  await pool.query(`UPDATE usuarios SET passwordhash = $1 WHERE idusuario = $2`, [hashNueva, idUsuario])
  return { success: true }
}

module.exports = { crearAgente, crearEstudiante, listarAgentes, actualizarEspecialidadAgente, cambiarPasswordUsuario }
