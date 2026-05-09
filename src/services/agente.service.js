const { getConnection } = require('../config/db')

const obtenerPerfilAgente = async (idUsuario) => {
  let conn
  try {
    conn = await getConnection()

    const result = await conn.execute(
      `SELECT 
        a."IdAgente",
        a."Especialidad",
        a."NivelAcceso",
        a."SedeAsignada",
        u."NombreCompleto",
        u."CorreoInstitucional",
        u."Rol"
       FROM "Agentes" a
       JOIN "Usuarios" u ON u."IdUsuario" = a."IdUsuario"
       WHERE a."IdUsuario" = :idUsuario`,
      { idUsuario }
    )

    if (result.rows.length === 0) throw new Error('AGENTE_NO_ENCONTRADO')

    const [idAgente, especialidad, nivelAcceso, sedeAsignada, nombreCompleto, correoInstitucional, rol] = result.rows[0]

    console.log(`\nPerfil del agente ${idUsuario}:`, result.rows[0]);

    return { idAgente, especialidad, nivelAcceso, sedeAsignada, nombreCompleto, correoInstitucional, rol, esGerencial: nivelAcceso >= 3 }

    } catch (err) {
      throw err
    } finally {
      if (conn) await conn.close()
    }
}

const obtenerTicketPrioridad = async (idAgente) => {
  let conn
  try {
    conn = await getConnection()

    const result = await conn.execute(
      `SELECT 
        t."IdTicket",
        t."FechaCreacion",
        t."PrioridadSLA",
        t."TipologiaITIL",
        t."Estado",
        t."Descripcion"
       FROM "Tickets" t
       WHERE t."IdAgente" = :idAgente
       AND t."Estado" = 'Abierto'
       ORDER BY 
        CASE 
          WHEN t."PrioridadSLA" = 'Alta'  THEN 1
          WHEN t."PrioridadSLA" = 'Media' THEN 2
          WHEN t."PrioridadSLA" = 'Baja'  THEN 3
          ELSE 4
        END ASC,
        t."FechaCreacion" ASC
       FETCH FIRST 1 ROWS ONLY`,
      { idAgente }
    )

    if (result.rows.length === 0) return null

    const [idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado, descripcion] = result.rows[0]
    
    console.log(`\nTicket de mayor prioridad para el agente ${idAgente}:`, result.rows[0]);

    return { idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado, descripcion }

  } catch (err) {
    throw err
  } finally {
    if (conn) await conn.close()
  }
}

const obtenerTicketsAsignados = async (idAgente) => {
  let conn
  try {
    conn = await getConnection()

    const result = await conn.execute(
      `SELECT 
        t."IdTicket",
        t."FechaCreacion",
        t."PrioridadSLA",
        t."TipologiaITIL",
        t."Estado",
        t."Descripcion"
       FROM "Tickets" t
       WHERE t."IdAgente" = :idAgente
       ORDER BY t."FechaCreacion" DESC`,
      { idAgente }
    )

    console.log(`\nTickets asignados al agente ${idAgente}:`, result.rows);

    return result.rows.map(([idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado, descripcion]) => ({
      idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado, descripcion
    }))

  } catch (err) {
    throw err
  } finally {
    if (conn) await conn.close()
  }
}

module.exports = { obtenerPerfilAgente, obtenerTicketPrioridad, obtenerTicketsAsignados }