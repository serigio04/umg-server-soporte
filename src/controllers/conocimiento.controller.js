const conocimientoService = require('../services/conocimiento.service');

/**
 * Obtener listado de artículos (con filtros de búsqueda).
 * GET /api/conocimiento
 */
const getArticulos = async (req, res) => {
  try {
    const { titulo, categoria, buscar } = req.query;
    const articulos = await conocimientoService.obtenerArticulos({ titulo, categoria, buscar });
    res.status(200).json(articulos);
  } catch (err) {
    console.error('Error al obtener artículos:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Obtener detalle de un artículo por su ID.
 * GET /api/conocimiento/:idArticulo
 */
const getArticuloById = async (req, res) => {
  const { idArticulo } = req.params;
  try {
    const articulo = await conocimientoService.obtenerArticuloPorId(idArticulo);
    res.status(200).json(articulo);
  } catch (err) {
    if (err.message === 'ID_ARTICULO_INVALIDO') {
      return res.status(400).json({ message: 'El ID de artículo provisto es inválido' });
    }
    if (err.message === 'ARTICULO_NO_ENCONTRADO') {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }
    console.error('Error al obtener artículo por ID:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Crear un nuevo artículo.
 * POST /api/conocimiento
 */
const createArticulo = async (req, res) => {
  const { titulo, contenidoMarkdown, categoria } = req.body;

  if (!titulo || !contenidoMarkdown || !categoria) {
    return res.status(400).json({ message: 'El título, contenidoMarkdown y categoría son campos obligatorios' });
  }

  try {
    const nuevoArticulo = await conocimientoService.crearArticulo({
      titulo,
      contenidoMarkdown,
      categoria
    });
    res.status(201).json({
      message: 'Artículo creado exitosamente',
      articulo: nuevoArticulo
    });
  } catch (err) {
    if (err.message === 'DATOS_REQUERIDOS') {
      return res.status(400).json({ message: 'Los datos de creación son insuficientes o inválidos' });
    }
    console.error('Error al crear artículo:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Actualizar un artículo existente.
 * PUT /api/conocimiento/:idArticulo
 */
const updateArticulo = async (req, res) => {
  const { idArticulo } = req.params;
  const { titulo, contenidoMarkdown, categoria } = req.body;

  try {
    const articuloActualizado = await conocimientoService.actualizarArticulo(idArticulo, {
      titulo,
      contenidoMarkdown,
      categoria
    });
    res.status(200).json({
      message: 'Artículo actualizado exitosamente',
      articulo: articuloActualizado
    });
  } catch (err) {
    if (err.message === 'ID_ARTICULO_INVALIDO') {
      return res.status(400).json({ message: 'El ID de artículo provisto es inválido' });
    }
    if (err.message === 'ARTICULO_NO_ENCONTRADO') {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }
    console.error('Error al actualizar artículo:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Eliminar un artículo existente.
 * DELETE /api/conocimiento/:idArticulo
 */
const deleteArticulo = async (req, res) => {
  const { idArticulo } = req.params;

  try {
    await conocimientoService.eliminarArticulo(idArticulo);
    res.status(200).json({ message: 'Artículo eliminado exitosamente' });
  } catch (err) {
    if (err.message === 'ID_ARTICULO_INVALIDO') {
      return res.status(400).json({ message: 'El ID de artículo provisto es inválido' });
    }
    if (err.message === 'ARTICULO_NO_ENCONTRADO') {
      return res.status(404).json({ message: 'Artículo no encontrado' });
    }
    console.error('Error al eliminar artículo:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo
};
