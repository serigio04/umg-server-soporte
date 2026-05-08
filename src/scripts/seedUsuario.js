require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { initDB, getConnection } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  await initDB()
  const conn = await getConnection()

  const passwordHash = await bcrypt.hash('123456', 10)

    await conn.execute(
        `INSERT INTO "Usuarios" ("NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol")
        VALUES (:nombre, :correo, :hash, :rol)`,
        {
            nombre: 'Sergio Gomar',
            correo: 'sergio@miumg.edu.gt',
            hash: passwordHash,
            rol: 'Estudiante'
        },
        { autoCommit: true }
    )

  console.log('Usuario de prueba creado')
  await conn.close()
  process.exit()
}

seed().catch(console.error)