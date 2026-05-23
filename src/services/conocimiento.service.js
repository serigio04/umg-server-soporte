const { pool } = require('../config/db');

/**
 * Obtener todos los artículos con filtros opcionales de búsqueda.
 */
const obtenerArticulos = async ({ titulo, categoria, buscar } = {}) => {
  let query = `
    SELECT a.idarticulo, a.titulo, a.contenidomarkdown, a.vistas, a.idbase, b.categoria
    FROM articulos a
    LEFT JOIN basesconocimiento b ON a.idbase = b.idbase
    WHERE 1=1
  `;
  const values = [];
  let count = 1;

  if (titulo) {
    query += ` AND a.titulo ILIKE $${count}`;
    values.push(`%${titulo}%`);
    count++;
  }

  if (categoria) {
    query += ` AND b.categoria ILIKE $${count}`;
    values.push(`%${categoria}%`);
    count++;
  }

  if (buscar) {
    query += ` AND (a.titulo ILIKE $${count} OR a.contenidomarkdown ILIKE $${count} OR b.categoria ILIKE $${count})`;
    values.push(`%${buscar}%`);
    count++;
  }

  query += ' ORDER BY a.idarticulo DESC';

  const result = await pool.query(query, values);
  return result.rows.map(r => ({
    idArticulo: r.idarticulo,
    titulo: r.titulo,
    contenidoMarkdown: r.contenidomarkdown,
    vistas: r.vistas,
    idBase: r.idbase,
    categoria: r.categoria
  }));
};

/**
 * Obtener detalle de un artículo por su ID incrementando las vistas.
 */
const obtenerArticuloPorId = async (idArticulo) => {
  const idArticuloInt = Number(idArticulo);
  if (!Number.isInteger(idArticuloInt) || Number.isNaN(idArticuloInt)) {
    throw new Error('ID_ARTICULO_INVALIDO');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Incrementar vistas de forma atómica y verificar existencia
    const updateRes = await client.query(
      'UPDATE articulos SET vistas = COALESCE(vistas, 0) + 1 WHERE idarticulo = $1 RETURNING vistas',
      [idArticuloInt]
    );

    if (updateRes.rows.length === 0) {
      throw new Error('ARTICULO_NO_ENCONTRADO');
    }

    const nuevasVistas = updateRes.rows[0].vistas;

    // Obtener detalles completos
    const result = await client.query(
      `SELECT a.idarticulo, a.titulo, a.contenidomarkdown, a.idbase, b.categoria
       FROM articulos a
       LEFT JOIN basesconocimiento b ON a.idbase = b.idbase
       WHERE a.idarticulo = $1`,
      [idArticuloInt]
    );

    const r = result.rows[0];

    await client.query('COMMIT');

    return {
      idArticulo: r.idarticulo,
      titulo: r.titulo,
      contenidoMarkdown: r.contenidomarkdown,
      vistas: nuevasVistas,
      idBase: r.idbase,
      categoria: r.categoria
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Crear un artículo nuevo y asociarlo a una categoría (BaseConocimiento).
 */
const crearArticulo = async ({ titulo, contenidoMarkdown, categoria }) => {
  if (!titulo || !contenidoMarkdown || !categoria) {
    throw new Error('DATOS_REQUERIDOS');
  }

  const cleanCategoria = categoria.trim();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let idBase;
    const baseRes = await client.query(
      'SELECT idbase FROM basesconocimiento WHERE LOWER(categoria) = LOWER($1)',
      [cleanCategoria]
    );

    if (baseRes.rows.length > 0) {
      idBase = baseRes.rows[0].idbase;
      await client.query(
        'UPDATE basesconocimiento SET totalarticulos = totalarticulos + 1 WHERE idbase = $1',
        [idBase]
      );
    } else {
      const insertBaseRes = await client.query(
        'INSERT INTO basesconocimiento (categoria, totalarticulos) VALUES ($1, 1) RETURNING idbase',
        [cleanCategoria]
      );
      idBase = insertBaseRes.rows[0].idbase;
    }

    const artRes = await client.query(
      `INSERT INTO articulos (titulo, contenidomarkdown, vistas, idbase)
       VALUES ($1, $2, 0, $3)
       RETURNING idarticulo, titulo, contenidomarkdown, vistas, idbase`,
      [titulo.trim(), contenidoMarkdown, idBase]
    );

    await client.query('COMMIT');
    
    const art = artRes.rows[0];
    return {
      idArticulo: art.idarticulo,
      titulo: art.titulo,
      contenidoMarkdown: art.contenidomarkdown,
      vistas: art.vistas,
      idBase: art.idbase,
      categoria: cleanCategoria
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Actualizar un artículo existente y reasociar su base si cambia la categoría.
 */
const actualizarArticulo = async (idArticulo, { titulo, contenidoMarkdown, categoria }) => {
  const idArticuloInt = Number(idArticulo);
  if (!Number.isInteger(idArticuloInt) || Number.isNaN(idArticuloInt)) {
    throw new Error('ID_ARTICULO_INVALIDO');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener artículo actual bloqueando solo la tabla principal 'articulos'
    const currentRes = await client.query(
      `SELECT idarticulo, titulo, contenidomarkdown, idbase
       FROM articulos
       WHERE idarticulo = $1 FOR UPDATE`,
      [idArticuloInt]
    );

    if (currentRes.rows.length === 0) {
      throw new Error('ARTICULO_NO_ENCONTRADO');
    }

    const currentArt = currentRes.rows[0];
    let newIdBase = currentArt.idbase;
    let oldCategoria = '';

    // Obtener el nombre de la categoría anterior si existía base asociada
    if (currentArt.idbase) {
      const catRes = await client.query(
        'SELECT categoria FROM basesconocimiento WHERE idbase = $1',
        [currentArt.idbase]
      );
      if (catRes.rows.length > 0) {
        oldCategoria = catRes.rows[0].categoria;
      }
    }

    let activeCategoria = oldCategoria;

    // Validar si cambió la categoría
    if (categoria && categoria.trim().toLowerCase() !== oldCategoria.toLowerCase()) {
      const cleanCategoria = categoria.trim();
      activeCategoria = cleanCategoria;

      // Buscar o crear la nueva categoría
      const newBaseRes = await client.query(
        'SELECT idbase FROM basesconocimiento WHERE LOWER(categoria) = LOWER($1)',
        [cleanCategoria]
      );

      if (newBaseRes.rows.length > 0) {
        newIdBase = newBaseRes.rows[0].idbase;
        await client.query(
          'UPDATE basesconocimiento SET totalarticulos = totalarticulos + 1 WHERE idbase = $1',
          [newIdBase]
        );
      } else {
        const insertBaseRes = await client.query(
          'INSERT INTO basesconocimiento (categoria, totalarticulos) VALUES ($1, 1) RETURNING idbase',
          [cleanCategoria]
        );
        newIdBase = insertBaseRes.rows[0].idbase;
      }

      // Decrementar el contador en la categoría anterior
      if (currentArt.idbase) {
        await client.query(
          'UPDATE basesconocimiento SET totalarticulos = GREATEST(0, totalarticulos - 1) WHERE idbase = $1',
          [currentArt.idbase]
        );
      }
    }

    const finalTitulo = titulo !== undefined ? titulo.trim() : currentArt.titulo;
    const finalContenido = contenidoMarkdown !== undefined ? contenidoMarkdown : currentArt.contenidomarkdown;

    const updateRes = await client.query(
      `UPDATE articulos
       SET titulo = $1, contenidomarkdown = $2, idbase = $3
       WHERE idarticulo = $4
       RETURNING idarticulo, titulo, contenidomarkdown, vistas, idbase`,
      [finalTitulo, finalContenido, newIdBase, idArticuloInt]
    );

    await client.query('COMMIT');

    const art = updateRes.rows[0];
    return {
      idArticulo: art.idarticulo,
      titulo: art.titulo,
      contenidoMarkdown: art.contenidomarkdown,
      vistas: art.vistas,
      idBase: art.idbase,
      categoria: activeCategoria
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Eliminar artículo y decrementar la cantidad en su categoría.
 */
const eliminarArticulo = async (idArticulo) => {
  const idArticuloInt = Number(idArticulo);
  if (!Number.isInteger(idArticuloInt) || Number.isNaN(idArticuloInt)) {
    throw new Error('ID_ARTICULO_INVALIDO');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const artRes = await client.query(
      'SELECT idbase FROM articulos WHERE idarticulo = $1 FOR UPDATE',
      [idArticuloInt]
    );

    if (artRes.rows.length === 0) {
      throw new Error('ARTICULO_NO_ENCONTRADO');
    }

    const idBase = artRes.rows[0].idbase;

    await client.query('DELETE FROM articulos WHERE idarticulo = $1', [idArticuloInt]);

    if (idBase) {
      await client.query(
        'UPDATE basesconocimiento SET totalarticulos = GREATEST(0, totalarticulos - 1) WHERE idbase = $1',
        [idBase]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerArticulos,
  obtenerArticuloPorId,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo
};
