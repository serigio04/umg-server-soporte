require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { initDB, getConnection } = require('../config/db')
const bcrypt = require('bcryptjs')
const oracledb = require('oracledb')

async function seed() {
  await initDB()
  const conn = await getConnection()

  try {
    const agentes = [
      { nombre: 'Agente Solicitudes', correo: 'solicitudes@miumg.edu.gt', especialidad: 'Solicitud', nivel: 2, sede: 'Campus Central' },
      { nombre: 'Agente Cambios',     correo: 'cambios@miumg.edu.gt',     especialidad: 'Cambio',    nivel: 2, sede: 'Campus Central' },
    ]

    for (const a of agentes) {
      const hash = await bcrypt.hash('123456', 10)

      const r = await conn.execute(
        `INSERT INTO "Usuarios" ("NombreCompleto", "CorreoInstitucional", "PasswordHash", "Rol")
         VALUES (:nombre, :correo, :hash, 'Agente')
         RETURNING "IdUsuario" INTO :idUsuario`,
        { nombre: a.nombre, correo: a.correo, hash, idUsuario: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
        { autoCommit: false }
      )

      const idUsuario = r.outBinds.idUsuario[0]

      await conn.execute(
        `INSERT INTO "Agentes" ("Especialidad", "NivelAcceso", "SedeAsignada", "IdUsuario", "UsuarioIdUsuario")
         VALUES (:especialidad, :nivel, :sede, :idUsuario, :idUsuario2)`,
        { especialidad: a.especialidad, nivel: a.nivel, sede: a.sede, idUsuario, idUsuario2: idUsuario },
        { autoCommit: false }
      )

      console.log(`✅ ${a.nombre} creado — ${a.correo} / 123456`)
    }

    await conn.commit()

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    await conn.close()
    process.exit()
  }
}

seed().catch(console.error)