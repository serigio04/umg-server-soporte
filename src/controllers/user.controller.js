const userService = require('../services/user.service')

const registrarAgente = async (req, res) => {
  try {
    const { nombreCompleto, correoInstitucional, password, especialidad, nivelAcceso, sedeAsignada } = req.body

    if (!nombreCompleto || !correoInstitucional || !password || !especialidad || !nivelAcceso || !sedeAsignada) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' })
    }

    const resultado = await userService.crearAgente({
      nombreCompleto,
      correoInstitucional,
      password,
      especialidad,
      nivelAcceso,
      sedeAsignada
    })

    res.status(201).json({ message: 'Agente creado exitosamente', data: resultado })
  } catch (err) {
    if (err.code === '23505') { // Código de PostgreSQL para UNIQUE constraint violation
      return res.status(400).json({ message: 'El correo ya está registrado' })
    }
    console.error('Error registrando agente:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const registrarEstudiante = async (req, res) => {
  try {
    const { nombreCompleto, correoInstitucional, password, carne, carrera } = req.body

    if (!nombreCompleto || !correoInstitucional || !password || !carne || !carrera) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' })
    }

    const resultado = await userService.crearEstudiante({
      nombreCompleto,
      correoInstitucional,
      password,
      carne,
      carrera
    })

    res.status(201).json({ message: 'Estudiante creado exitosamente', data: resultado })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'El correo o carné ya está registrado' })
    }
    console.error('Error registrando estudiante:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const listarAgentes = async (req, res) => {
  try {
    const agentes = await userService.listarAgentes()
    res.json(agentes)
  } catch (err) {
    console.error('Error listando agentes:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const modificarEspecialidad = async (req, res) => {
  try {
    const { idAgente } = req.params
    const { especialidad } = req.body
    
    if (!especialidad) {
      return res.status(400).json({ message: 'La especialidad es obligatoria' })
    }

    await userService.actualizarEspecialidadAgente(idAgente, especialidad)
    res.json({ message: 'Especialidad actualizada exitosamente' })
  } catch (err) {
    if (err.message === 'AGENTE_NO_ENCONTRADO') {
      return res.status(404).json({ message: 'Agente no encontrado' })
    }
    console.error('Error actualizando especialidad:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body
    const idUsuario = req.usuario.idUsuario // from token

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ message: 'Ambas contraseñas son requeridas' })
    }

    await userService.cambiarPasswordUsuario(idUsuario, passwordActual, passwordNueva)
    res.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (err) {
    if (err.message === 'PASSWORD_INCORRECTA') {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' })
    }
    console.error('Error cambiando contraseña:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

module.exports = { registrarAgente, registrarEstudiante, listarAgentes, modificarEspecialidad, cambiarPassword }
