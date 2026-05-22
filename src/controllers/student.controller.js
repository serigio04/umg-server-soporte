const studentService = require('../services/student.service')

const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await studentService.obtenerPerfilEstudiante(req.usuario.idUsuario);
    res.json(perfil);
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO');
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    console.error('Error obteniendo perfil:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const obtenerPorCarne = async (req, res) => {
  const { carne } = req.params;
  
  if (!carne)
    return res.status(400).json({ message: 'Carné requerido' });
  
  try {
    const estudiante = await studentService.obtenerEstudiantePorCarne(carne);
    res.json(estudiante);
  } catch (err) {
    if (err.message === 'ESTUDIANTE_NO_ENCONTRADO')
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    console.error('Error obteniendo estudiante:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { obtenerPerfil, obtenerPorCarne }