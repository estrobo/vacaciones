const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar el token JWT
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar rol
const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
    }
    next();
  };
};

// Middleware para verificar acceso a una sección
const checkSeccion = (seccion) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    // Administradores y RRHH tienen acceso a todo
    if (req.usuario.rol === 'administrador') {
      return next();
    }
    const secciones = req.usuario.secciones || [];
    if (!secciones.includes(seccion)) {
      return res.status(403).json({ error: 'No tienes acceso a esta sección' });
    }
    next();
  };
};

module.exports = { auth, checkRole, checkSeccion };
