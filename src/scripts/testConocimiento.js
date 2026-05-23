require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool, initDB } = require('../config/db');
const conocimientoService = require('../services/conocimiento.service');

async function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de integración del módulo Base de Conocimiento...');
  await initDB();

  // Limpieza inicial por si acaso quedaron residuos de pruebas previas fallidas
  await pool.query("DELETE FROM articulos WHERE titulo LIKE '%Test%'");
  await pool.query("DELETE FROM basesconocimiento WHERE categoria LIKE '%Test%'");

  try {
    // -------------------------------------------------------------
    // PRUEBA 1: Crear un artículo (debería crear la categoría automáticamente)
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 1: Creación de artículo y base de conocimiento ---');
    const artCreado = await conocimientoService.crearArticulo({
      titulo: 'Test de Configuración Inicial',
      contenidoMarkdown: '# Guía de instalación\nInstrucciones para iniciar la prueba...',
      categoria: 'Soporte Test'
    });

    await assert(artCreado.idArticulo !== undefined, 'El artículo creado debe tener un idArticulo');
    await assert(artCreado.titulo === 'Test de Configuración Inicial', 'El título del artículo coincide');
    await assert(artCreado.categoria === 'Soporte Test', 'La categoría coincide');
    await assert(artCreado.vistas === 0, 'Las vistas iniciales deben ser 0');

    // Verificar que en la base de datos se haya creado la categoría con TotalArticulos = 1
    const baseDb = await pool.query(
      'SELECT idbase, categoria, totalarticulos FROM basesconocimiento WHERE LOWER(categoria) = LOWER($1)',
      ['Soporte Test']
    );
    await assert(baseDb.rows.length === 1, 'Se debió crear exactamente 1 registro en BasesConocimiento');
    await assert(Number(baseDb.rows[0].totalarticulos) === 1, 'El contador totalarticulos de la categoría debe ser 1');
    const idBaseOriginal = baseDb.rows[0].idbase;

    // -------------------------------------------------------------
    // PRUEBA 2: Crear un segundo artículo en la misma categoría
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 2: Creación de segundo artículo en misma categoría ---');
    const artCreado2 = await conocimientoService.crearArticulo({
      titulo: 'Test de Configuración Avanzada',
      contenidoMarkdown: 'Detalles avanzados...',
      categoria: 'Soporte Test'
    });

    const baseDbActualizada = await pool.query(
      'SELECT totalarticulos FROM basesconocimiento WHERE idbase = $1',
      [idBaseOriginal]
    );
    await assert(
      Number(baseDbActualizada.rows[0].totalarticulos) === 2,
      'El contador totalarticulos de la categoría debe subir a 2'
    );

    // -------------------------------------------------------------
    // PRUEBA 3: Buscar y listar artículos (getArticulos)
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 3: Búsqueda y filtrado de artículos ---');
    // Filtro por título
    const artsPorTitulo = await conocimientoService.obtenerArticulos({ titulo: 'Inicial' });
    await assert(artsPorTitulo.length >= 1, 'Debe encontrar al menos 1 artículo con título "Inicial"');

    // Filtro por categoría
    const artsPorCategoria = await conocimientoService.obtenerArticulos({ categoria: 'Soporte Test' });
    await assert(artsPorCategoria.length === 2, 'Debe retornar exactamente 2 artículos para la categoría "Soporte Test"');

    // Filtro por búsqueda general (palabras clave)
    const artsPorBusqueda = await conocimientoService.obtenerArticulos({ buscar: 'instalación' });
    await assert(artsPorBusqueda.length >= 1, 'Debe encontrar artículos con la palabra clave "instalación"');

    // -------------------------------------------------------------
    // PRUEBA 4: Obtener artículo por ID e incremento de vistas
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 4: Obtener artículo por ID e incremento de vistas ---');
    const artId = artCreado.idArticulo;
    const primerFetch = await conocimientoService.obtenerArticuloPorId(artId);
    await assert(primerFetch.vistas === 1, 'Las vistas debieron incrementarse a 1');

    const segundoFetch = await conocimientoService.obtenerArticuloPorId(artId);
    await assert(segundoFetch.vistas === 2, 'Las vistas debieron incrementarse a 2');

    // -------------------------------------------------------------
    // PRUEBA 5: Actualizar artículo y cambiar su categoría (Reasociación de bases)
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 5: Actualización de artículo y transferencia de categoría ---');
    const artActualizado = await conocimientoService.actualizarArticulo(artId, {
      titulo: 'Test de Configuración Modificado',
      categoria: 'Preguntas Frecuentes Test' // Nueva categoría
    });

    await assert(artActualizado.titulo === 'Test de Configuración Modificado', 'El título se actualizó');
    await assert(artActualizado.categoria === 'Preguntas Frecuentes Test', 'La categoría cambió a "Preguntas Frecuentes Test"');

    // Verificar contadores de base de conocimiento vieja
    const baseVieja = await pool.query(
      'SELECT totalarticulos FROM basesconocimiento WHERE idbase = $1',
      [idBaseOriginal]
    );
    await assert(
      Number(baseVieja.rows[0].totalarticulos) === 1,
      'La categoría vieja "Soporte Test" debe decrementar su total a 1 (tenía 2)'
    );

    // Verificar contadores de base de conocimiento nueva
    const baseNueva = await pool.query(
      'SELECT idbase, totalarticulos FROM basesconocimiento WHERE LOWER(categoria) = LOWER($1)',
      ['Preguntas Frecuentes Test']
    );
    await assert(baseNueva.rows.length === 1, 'Se debió crear la categoría "Preguntas Frecuentes Test"');
    await assert(
      Number(baseNueva.rows[0].totalarticulos) === 1,
      'La categoría nueva "Preguntas Frecuentes Test" debe tener total a 1'
    );
    const idBaseNueva = baseNueva.rows[0].idbase;

    // -------------------------------------------------------------
    // PRUEBA 6: Eliminar artículos y validar decremento
    // -------------------------------------------------------------
    console.log('\n--- PRUEBA 6: Eliminación de artículos ---');
    // Eliminar artículo de la categoría "Preguntas Frecuentes Test"
    await conocimientoService.eliminarArticulo(artId);

    const baseNuevaDespuesEliminar = await pool.query(
      'SELECT totalarticulos FROM basesconocimiento WHERE idbase = $1',
      [idBaseNueva]
    );
    await assert(
      Number(baseNuevaDespuesEliminar.rows[0].totalarticulos) === 0,
      'La categoría nueva "Preguntas Frecuentes Test" debe quedar con totalarticulos = 0'
    );

    // Eliminar el segundo artículo
    await conocimientoService.eliminarArticulo(artCreado2.idArticulo);
    const baseOriginalDespuesEliminar = await pool.query(
      'SELECT totalarticulos FROM basesconocimiento WHERE idbase = $1',
      [idBaseOriginal]
    );
    await assert(
      Number(baseOriginalDespuesEliminar.rows[0].totalarticulos) === 0,
      'La categoría original "Soporte Test" debe quedar con totalarticulos = 0'
    );

    // Intentar buscar el artículo eliminado
    try {
      await conocimientoService.obtenerArticuloPorId(artId);
      await assert(false, 'Se debió lanzar un error al buscar un artículo inexistente/eliminado');
    } catch (err) {
      await assert(err.message === 'ARTICULO_NO_ENCONTRADO', 'Debe lanzar "ARTICULO_NO_ENCONTRADO" al no existir');
    }

    console.log('\n🌟 ¡TODAS LAS PRUEBAS SE COMPLETARON CON ÉXITO! 🌟');
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA EJECUCIÓN DE LAS PRUEBAS:', error);
  } finally {
    // Limpieza final de datos de prueba
    await pool.query("DELETE FROM articulos WHERE titulo LIKE '%Test%'");
    await pool.query("DELETE FROM basesconocimiento WHERE categoria LIKE '%Test%'");
    await pool.end();
    console.log('🔌 Conexión a la base de datos cerrada.');
  }
}

runTests().catch(console.error);
