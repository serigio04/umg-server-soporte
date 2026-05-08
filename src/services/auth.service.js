const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getConnection } = require('../config/db')

const login = async ({ correo, password }) => {
  let connection
  try {
    //conectar a la base de datos
    connection = await getConnection()

    const result = await connection.execute(
      `SELECT "IdUsuario", "NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol"
       FROM "Usuarios"
       WHERE "CorreoInstitucional" = :correo`,
      { correo }
    )

    if (result.rows.length === 0)
      throw new Error('CREDENCIALES_INVALIDAS')

    const [idUsuario, nombreCompleto, correoInstitucional, passwordHash, rol] = result.rows[0]

    const passwordValida = await bcrypt.compare(password, passwordHash)
    if (!passwordValida)
      throw new Error('CREDENCIALES_INVALIDAS')

    const token = jwt.sign(
      { idUsuario, rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    console.log(`\nUsuario autenticado: ${correoInstitucional} (ID: ${idUsuario}, Rol: ${rol})`);

    return {
      token,
      usuario: { idUsuario, nombreCompleto, correoInstitucional, rol }
    }

  } catch (err) {
    console.error('Error en authService.login:', err)
    throw err
  } finally {
    if (connection) await connection.close()
  }
}

module.exports = { login }