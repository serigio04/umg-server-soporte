const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const login = async ({ correo, password }) => {
  const result = await pool.query(
    `SELECT IdUsuario, NombreCompleto, CorreoInstitucional, PasswordHash as passwordhash, Rol
    FROM Usuarios
    WHERE CorreoInstitucional = $1`,
    [correo]
  )

  if (result.rows.length === 0) throw new Error('CREDENCIALES_INVALIDAS')

  const user = result.rows[0]
  console.log('User found:', user);
  console.log('Password hash:', user.passwordhash);

  const passwordValida = await bcrypt.compare(password, user.passwordhash);
  if (!passwordValida) throw new Error('CREDENCIALES_INVALIDAS')

  const token = jwt.sign(
    { idUsuario: user.idusuario, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  return {
    token,
    usuario: {
      idUsuario:            user.idusuario,
      nombreCompleto:       user.nombrecompleto,
      correoInstitucional:  user.correoinstitucional,
      rol:                  user.rol
    }
  }
}

module.exports = { login }