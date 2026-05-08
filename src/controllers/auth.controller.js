const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getConnection } = require('../config/db')

const login = async (req, res) => {
  const { correo, password } = req.body

  if (!correo || !password)
    return res.status(400).json({ message: 'Correo y contraseña requeridos' })

  let conn
  try {
    conn = await getConnection()

    // Busca el usuario por correo
    const result = await conn.execute(
        `SELECT "IdUsuario", "NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol"
        FROM "Usuarios"
        WHERE "CorreoInstitucional" = :correo`,
    { correo }
    )

    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Credenciales incorrectas' })

    const [idUsuario, nombreCompleto, correoInstitucional, passwordHash, rol] = result.rows[0]

    // Verifica contraseña
    const passwordValida = await bcrypt.compare(password, passwordHash)
    if (!passwordValida)
      return res.status(401).json({ message: 'Credenciales incorrectas' })

    // Genera JWT
    const token = jwt.sign(
      { idUsuario, rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: { idUsuario, nombreCompleto, correoInstitucional, rol }
    })

  } catch (err) {
    console.error('Error en login:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  } finally {
    if (conn) await conn.close()
  }
}

module.exports = { login }