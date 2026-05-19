const jwt = require('jsonwebtoken')

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

    if (!token)
        return res.status(401).json({ message: 'Token requerido' })

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { idUsuario, rol }
        console.log('Token verificado, payload:', payload);
        next()
    } catch {
        res.status(403).json({ message: 'Token inválido o expirado' })
    }
}

function soloRol(...roles) {
    return (req, res, next) => {
        console.log('Verificando rol del usuario:', req.usuario);
        console.log('Roles permitidos para esta ruta:', roles);
        if (!roles.includes(req.usuario.rol))
        return res.status(403).json({ message: 'No tienes permiso para esto' })
        next()
    }
}

module.exports = { verificarToken, soloRol }