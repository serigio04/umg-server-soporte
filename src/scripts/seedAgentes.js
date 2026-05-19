require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const agentes = [
      { nombre: 'Agente Incidentes',  correo: 'incidentes@miumg.edu.gt', especialidad: 'Incidente', nivel: 2, sede: 'Campus Central' },
      { nombre: 'Agente Solicitudes', correo: 'solicitudes@miumg.edu.gt', especialidad: 'Solicitud', nivel: 2, sede: 'Campus Central' },
      { nombre: 'Agente Cambios',     correo: 'cambios@miumg.edu.gt',     especialidad: 'Cambio',    nivel: 2, sede: 'Campus Central' },
    ];

    for (const agente of agentes) {
      const hash = await bcrypt.hash('123456', 10)

      const query = await client.query(
        `INSERT INTO Usuarios (NombreCompleto, CorreoInstitucional, PasswordHash, Rol)
         VALUES ($1, $2, $3, 'Agente')
         RETURNING IdUsuario`,
        [ agente.nombre, agente.correo, hash ]
      )

      const idUsuario = query.rows[0].IdUsuario

      await client.query(
        `INSERT INTO Agentes (Especialidad, NivelAcceso, SedeAsignada, IdUsuario)
          VALUES ($1, $2, $3, $4)`,
        [ agente.especialidad, agente.nivel, agente.sede, idUsuario ]
      )

      console.log(`${agente.nombre} creado — ${agente.correo} / 123456`)
    }

    await client.query('COMMIT')
    console.log('Agentes creados exitosamente');

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error seeding agentes:', err, " Rolling back transaction.");
    throw err
  } finally {
    client.release()
    await pool.end()
    process.exit()
  }
}

seed().catch(console.error)