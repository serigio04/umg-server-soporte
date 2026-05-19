require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash('123456', 10)

    const userRes = await client.query(
      `INSERT INTO Usuarios (NombreCompleto, CorreoInstitucional, PasswordHash, Rol)
       VALUES ($1, $2, $3, 'Coordinador')
       RETURNING IdUsuario`,
      ['Coordinador UMG', 'coordinador@miumg.edu.gt', hash]
    )

    const idUsuario = userRes.rows[0].IdUsuario

    await client.query(
      `INSERT INTO Agentes (Especialidad, NivelAcceso, SedeAsignada, IdUsuario)
       VALUES ($1, $2, $3, $4)`,
      ['General', 3, 'Campus Central', idUsuario]
    )

    await client.query('COMMIT')
    console.log('Coordinador creado — coordinador@miumg.edu.gt / 123456')

  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
    process.exit()
  }
}

seed().catch(console.error)