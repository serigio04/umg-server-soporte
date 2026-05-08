const oracledb = require('oracledb');
const { getConnection } = require('../config/db');

const crearTicket = async ({tipologiaITIL, descripcion, idEstudiante}) => {
    const tipologiasValidas = ['Incidente', 'Solicitud', 'Cambio'];
    if (!tipologiasValidas.includes(tipologiaITIL))
        throw new Error('Tipologia invalida');

    const prioridad = 
        tipologiaITIL === 'Incidente' ? 'Alta' 
        : tipologiaITIL === 'Solicitud' ? 'Media' 
        : 'Baja';

    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `INSERT INTO "Tickets"
                ("FechaCreacion", "PrioridadSLA", "TipologiaITIL", "Estado", "IdEstudiante")
            VALUES
                (SYSDATE, :prioridad, :tipologia, 'Abierto', :idEstudiante)
            RETURNING "IdTicket" INTO :idTicket`,
            {
                prioridad,
                tipologia: tipologiaITIL,
                idEstudiante,
                idTicket: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
            },
            {
                autoCommit: false
            }
        );

        const idTicket = result.outBinds.idTicket[0];

        await connection.execute(
            `INSERT INTO "EstadosTicket"
                ("NombreEstado", "FechaCambio", "ComentarioTecnico", "IdTicket", "TicketIdTicket")
            VALUES
                ('Abierto', SYSDATE, 'Ticket creado', :idTicket, :idTicket2)`,
            { idTicket, idTicket2: idTicket },
            { autoCommit: false }
        );

        await connection.commit();

        return { idTicket, tipologiaITIL, descripcion, prioridad, estado: 'Abierto' };

        console.log(`\nTicket creado: {
            fechaCreacion = SYSDATE,
            idTicket = ${idTicket},
            tipologiaITIL = ${tipologiaITIL},
            descripcion = ${descripcion},
            prioridad = ${prioridad},
            estado: 'Abierto'
        }\n`);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en crearTicket:', error);
        throw error;
    } finally {
        if (connection) await connection.close();
    };
};

const obtenerTicketsEstudiante = async (idEstudiante) => {
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
        (
          SELECT e."NombreEstado"
          FROM "EstadosTicket" e
          WHERE e."TicketIdTicket" = t."IdTicket"
          ORDER BY e."FechaCambio" DESC
          FETCH FIRST 1 ROWS ONLY
        ) AS ULTIMO_ESTADO
       FROM "Tickets" t
       WHERE t."IdEstudiante" = :idEstudiante
       ORDER BY t."FechaCreacion" DESC`,
      { idEstudiante }
    )

    return result.rows.map(([idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado, ultimoEstado]) => ({
      idTicket,
      fechaCreacion,
      prioridadSLA,
      tipologiaITIL,
      estado,
      ultimoEstado
    }));

    console.log(`\nTickets del estudiante ${idEstudiante}:`, result.rows);

    } catch (err) {
        console.error('Error al obtener ticket:', err)
        throw err
    } finally {
        if (conn) await conn.close()
    }
}

const obtenerUltimoTicket = async (idEstudiante) => {
  let conn
  try {
    conn = await getConnection()

    const result = await conn.execute(
      `SELECT 
        t."IdTicket",
        t."FechaCreacion",
        t."PrioridadSLA",
        t."TipologiaITIL",
        t."Estado"
       FROM "Tickets" t
       WHERE t."IdEstudiante" = :idEstudiante
       ORDER BY t."FechaCreacion" DESC
       FETCH FIRST 1 ROWS ONLY`,
      { idEstudiante }
    )

    if (result.rows.length === 0) return null

    const [idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado] = result.rows[0]
    return { idTicket, fechaCreacion, prioridadSLA, tipologiaITIL, estado }

    console.log(`\nUltimo ticket del estudiante ${idEstudiante}:`, result.rows[0]);

  } catch (err) {
    console.error('Error al obtener el ultimo ticket:', err)
    throw err
  } finally {
    if (conn) await conn.close()
  }
}

module.exports = { crearTicket, obtenerTicketsEstudiante, obtenerUltimoTicket }