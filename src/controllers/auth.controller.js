const authService = require('../services/auth.service')

const login = async (req, res) => {
  const { correo, password } = req.body

  if (!correo || !password)
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' })

  try {
    const resultado = await authService.login({ correo, password })
    res.json(resultado)

  } catch (err) {
    if (err.message === 'CREDENCIALES_INVALIDAS')
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' })

    console.error('Error en login:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { login }