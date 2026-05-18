const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const login = async ({ correo, password }) => {
  const result = await pool.query(
    `SELECT IdUsuario, NombreCompleto, CorreoInstitucional, PasswordHash, Rol
     FROM Usuarios
     WHERE CorreoInstitucional = $1`,
    [correo]
  )

  if (result.rows.length === 0) throw new Error('CREDENCIALES_INVALIDAS')

  const user = result.rows[0]
  const passwordValida = await bcrypt.compare(password, user.PasswordHash)
  if (!passwordValida) throw new Error('CREDENCIALES_INVALIDAS')

  const token = jwt.sign(
    { idUsuario: user.IdUsuario, rol: user.Rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  return {
    token,
    usuario: {
      idUsuario:            user.IdUsuario,
      nombreCompleto:       user.NombreCompleto,
      correoInstitucional:  user.CorreoInstitucional,
      rol:                  user.Rol
    }
  }
}

module.exports = { login }