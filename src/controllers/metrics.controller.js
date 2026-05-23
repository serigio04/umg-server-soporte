const metricsService = require('../services/metrics.service')

const obtenerDashboardCoordinador = async (req, res) => {
  try {
    const metricas = await metricsService.obtenerMetricasCoordinador()
    res.json(metricas)
  } catch (err) {
    console.error('Error obteniendo métricas coordinador:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const obtenerMetricasAgente = async (req, res) => {
  try {
    const { idAgente } = req.params
    const metricas = await metricsService.obtenerMetricasAgente(idAgente)
    res.json(metricas)
  } catch (err) {
    console.error('Error obteniendo métricas agente:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const descargarReporteCsv = async (req, res) => {
  try {
    const datos = await metricsService.obtenerDatosReporteCsv()
    
    if (datos.length === 0) {
      return res.status(404).json({ message: 'No hay datos para exportar' })
    }

    // Convertir a CSV simple
    const encabezados = ['ID Ticket', 'Tipologia', 'Prioridad', 'Estado', 'Fecha Creacion', 'Agente', 'Estudiante']
    const filasCsv = datos.map(t => {
      return [
        t.idticket,
        t.tipologiaitil,
        t.prioridadsla,
        t.estado,
        new Date(t.fechacreacion).toLocaleString('es-GT'),
        t.agente || 'Sin Asignar',
        t.estudiante || 'Desconocido'
      ].map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(',')
    })

    const csvContent = [encabezados.join(','), ...filasCsv].join('\n')

    res.header('Content-Type', 'text/csv')
    res.attachment('reporte_tickets.csv')
    res.send(csvContent)
  } catch (err) {
    console.error('Error descargando reporte CSV:', err)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const descargarReporteExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const datos = await metricsService.obtenerDatosReporteCsv();

    if (datos.length === 0) {
      return res.status(404).json({ message: 'No hay datos para exportar' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Tickets');

    worksheet.columns = [
      { header: 'ID Ticket', key: 'idticket', width: 10 },
      { header: 'Tipología', key: 'tipologia', width: 25 },
      { header: 'Prioridad', key: 'prioridad', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Creación', key: 'fecha', width: 20 },
      { header: 'Agente', key: 'agente', width: 30 },
      { header: 'Estudiante', key: 'estudiante', width: 30 }
    ];

    datos.forEach(t => {
      worksheet.addRow({
        idticket: t.idticket,
        tipologia: t.tipologiaitil,
        prioridad: t.prioridadsla,
        estado: t.estado,
        fecha: new Date(t.fechacreacion).toLocaleString('es-GT'),
        agente: t.agente || 'Sin Asignar',
        estudiante: t.estudiante || 'Desconocido'
      });
    });

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('reporte_tickets.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error descargando reporte Excel:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

const descargarReporteCalificacionesExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const datos = await metricsService.obtenerDatosCalificacionesExcel();

    if (datos.length === 0) {
      return res.status(404).json({ message: 'No hay calificaciones para exportar' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calificaciones por Agente');

    worksheet.columns = [
      { header: 'Agente', key: 'agente', width: 30 },
      { header: 'Promedio de Calificación (1-5)', key: 'promedio_calificacion', width: 35 },
      { header: 'Porcentaje (%)', key: 'porcentaje_calificacion', width: 20 }
    ];

    datos.forEach(a => {
      worksheet.addRow({
        agente: a.agente,
        promedio_calificacion: Number(a.promedio_calificacion).toFixed(2),
        porcentaje_calificacion: Number(a.porcentaje_calificacion).toFixed(2) + '%'
      });
    });

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('reporte_calificaciones_agentes.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error descargando reporte Excel de calificaciones:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

module.exports = { obtenerDashboardCoordinador, obtenerMetricasAgente, descargarReporteCsv, descargarReporteExcel, descargarReporteCalificacionesExcel }
