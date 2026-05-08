require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { initDB, getConnection } = require('../config/db')
const bcrypt = require('bcryptjs')
const oracledb = require('oracledb')

async function seed() {
  await initDB()
  const conn = await getConnection()

  try {
    const hash = await bcrypt.hash('123456', 10)

    const r = await conn.execute(
      `INSERT INTO "Usuarios" ("NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol")
       VALUES ('Coordinador UMG', 'coordinador@miumg.edu.gt', :hash, 'Coordinador')
       RETURNING "IdUsuario" INTO :idUsuario`,
      { hash, idUsuario: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: false }
    )

    const idUsuario = r.outBinds.idUsuario[0]

    await conn.execute(
      `INSERT INTO "Agentes" ("Especialidad", "NivelAcceso", "SedeAsignada", "IdUsuario", "UsuarioIdUsuario")
       VALUES ('General', 3, 'Campus Central', :idUsuario, :idUsuario2)`,
      { idUsuario, idUsuario2: idUsuario },
      { autoCommit: false }
    )

    await conn.commit()
    console.log('✅ Coordinador creado — coordinador@miumg.edu.gt / 123456')

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    await conn.close()
    process.exit()
  }
}

seed().catch(console.error)