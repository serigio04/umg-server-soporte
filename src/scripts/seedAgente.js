require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { initDB, getConnection } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  await initDB()
  const conn = await getConnection()

  try {
    const passwordHash = await bcrypt.hash('123456', 10)

    // Crea el usuario base del agente
    const resultUsuario = await conn.execute(
      `INSERT INTO "Usuarios" ("NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol")
       VALUES (:nombre, :correo, :hash, :rol)
       RETURNING "IdUsuario" INTO :idUsuario`,
      {
        nombre: 'Agente Soporte UMG',
        correo: 'agente@miumg.edu.gt',
        hash: passwordHash,
        rol: 'Agente',
        idUsuario: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
      },
      { autoCommit: false }
    )

    const idUsuario = resultUsuario.outBinds.idUsuario[0]

    // Crea el agente vinculado al usuario
    await conn.execute(
      `INSERT INTO "Agentes" ("Especialidad", "NivelAcceso", "SedeAsignada", "IdUsuario", "UsuarioIdUsuario")
       VALUES (:especialidad, :nivelAcceso, :sede, :idUsuario, :idUsuario2)`,
      {
        especialidad: 'Soporte General',
        nivelAcceso: 2,
        sede: 'Campus Central',
        idUsuario,
        idUsuario2: idUsuario
      },
      { autoCommit: false }
    )

    await conn.commit()
    console.log('Agente de soporte creado')
    console.log('Correo: agente@miumg.edu.gt')
    console.log('Contraseña: 123456')

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    await conn.close()
    process.exit()
  }
}

seed().catch(console.error)