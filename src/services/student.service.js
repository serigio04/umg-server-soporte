const { pool } = require('../config/db');

const obtenerPerfilEstudiante = async (idUsuario) => {
    console.log('Buscando estudiante por usuario:', idUsuario);
    const result = await pool.query(
        `SELECT e.idestudiante, e.carne, e.carrera, e.saldoactual, u.nombrecompleto, u.correoinstitucional
        FROM estudiante e
        JOIN usuarios u ON u.idusuario = e.idusuario
        WHERE e.idusuario = $1`,
        [idUsuario]
    );
  
    if (result.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO');
    const estudiante = result.rows[0];

    console.log('Estudiante encontrado:', estudiante);
    
    return {
        idEstudiante:       estudiante.idestudiante,
        nombreCompleto:     estudiante.nombrecompleto,
        carne:              estudiante.carne,
        carrera:            estudiante.carrera,
        saldo:              estudiante.saldoactual,
        correoInstitucional: estudiante.correoinstitucional
    }
}

const obtenerEstudiantePorCarne = async (carne) => {
    console.log('Buscando estudiante por carné:', carne)
    const result = await pool.query(
        `SELECT e.idestudiante, e.carne, e.carrera, e.saldoactual, u.nombrecompleto, u.correoinstitucional
        FROM estudiante e
        JOIN usuarios u ON u.idusuario = e.idusuario
        WHERE e.carne = $1`,
        [carne]
    );
    
    if (result.rows.length === 0) throw new Error('ESTUDIANTE_NO_ENCONTRADO');
    const estudiante = result.rows[0];
    console.log('Estudiante encontrado:', estudiante);

    return {
        idEstudiante:       estudiante.idestudiante,
        nombreCompleto:     estudiante.nombrecompleto,
        carne:              estudiante.carne,
        carrera:            estudiante.carrera,
        saldo:              estudiante.saldoactual,
        correoInstitucional: estudiante.correoinstitucional
    }
}

module.exports = { obtenerPerfilEstudiante, obtenerEstudiantePorCarne }