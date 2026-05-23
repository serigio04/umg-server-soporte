const { pool } = require('../config/db')

const obtenerMetricasCoordinador = async () => {
  // 1. Tiempo de resolución promedio (en horas)
  const tiempoResQuery = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN estadosticket h_fin ON t.idticket = h_fin.idticket
    WHERE h_fin.nombreestado IN ('Resuelto', 'Cerrado')
      AND t.estado IN ('Resuelto', 'Cerrado')
  `)

  // 2. Tickets abiertos por agente
  const ticketsPorAgenteQuery = await pool.query(`
    SELECT u.nombrecompleto as agente, COUNT(t.idticket) as cantidad
    FROM agentes a
    JOIN usuarios u ON a.idusuario = u.idusuario
    LEFT JOIN tickets t ON a.idagente = t.idagente AND t.estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
    GROUP BY u.nombrecompleto
    ORDER BY cantidad DESC
  `)

  // 3. SLA Vencidos (Tickets abiertos donde ahora > fecha de creación + SLA)
  const slaVencidosQuery = await pool.query(`
    SELECT t.idticket, t.prioridadsla, t.fechacreacion, u.nombrecompleto as agente
    FROM tickets t
    LEFT JOIN agentes a ON t.idagente = a.idagente
    LEFT JOIN usuarios u ON a.idusuario = u.idusuario
    WHERE t.estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
      AND (
        (t.prioridadsla = 'Alta' AND NOW() > t.fechacreacion + INTERVAL '4 hours') OR
        (t.prioridadsla = 'Media' AND NOW() > t.fechacreacion + INTERVAL '24 hours') OR
        (t.prioridadsla = 'Baja' AND NOW() > t.fechacreacion + INTERVAL '48 hours')
      )
  `)

  return {
    tiempoPromedioResolucionHoras: tiempoResQuery.rows[0].tiempo_promedio_horas || 0,
    ticketsAbiertosPorAgente: ticketsPorAgenteQuery.rows,
    slaVencidos: slaVencidosQuery.rows
  }
}

const obtenerMetricasAgente = async (idAgente) => {
  const tiempoResQuery = await pool.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (h_fin.fechacambio - t.fechacreacion))/3600) as tiempo_promedio_horas
    FROM tickets t
    JOIN estadosticket h_fin ON t.idticket = h_fin.idticket
    WHERE h_fin.nombreestado IN ('Resuelto', 'Cerrado')
      AND t.estado IN ('Resuelto', 'Cerrado')
      AND t.idagente = $1
  `, [idAgente])

  const ticketsAbiertosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE idagente = $1 AND estado NOT IN ('Resuelto', 'Cerrado', 'Cancelado')
  `, [idAgente])

  const ticketsResueltosQuery = await pool.query(`
    SELECT COUNT(*) as cantidad
    FROM tickets
    WHERE idagente = $1 AND estado IN ('Resuelto', 'Cerrado')
  `, [idAgente])

  return {
    tiempoPromedioResolucionHoras: tiempoResQuery.rows[0].tiempo_promedio_horas || 0,
    ticketsAbiertos: parseInt(ticketsAbiertosQuery.rows[0].cantidad),
    ticketsResueltos: parseInt(ticketsResueltosQuery.rows[0].cantidad)
  }
}

const obtenerDatosReporteCsv = async () => {
  const query = await pool.query(`
    SELECT t.idticket, t.tipologiaitil, t.prioridadsla, t.estado, t.fechacreacion, 
           u_agente.nombrecompleto as agente, u_estudiante.nombrecompleto as estudiante
    FROM tickets t
    LEFT JOIN agentes a ON t.idagente = a.idagente
    LEFT JOIN usuarios u_agente ON a.idusuario = u_agente.idusuario
    LEFT JOIN estudiante e ON t.idestudiante = e.idestudiante
    LEFT JOIN usuarios u_estudiante ON e.idusuario = u_estudiante.idusuario
    ORDER BY t.fechacreacion DESC
  `)
  return query.rows
}

module.exports = { obtenerMetricasCoordinador, obtenerMetricasAgente, obtenerDatosReporteCsv }
