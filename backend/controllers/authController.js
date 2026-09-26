const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
require('dotenv').config();

// Registro de usuario (solicita acceso; un admin debe asignar datos laborales)
exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }
    const hashed = await bcrypt.hash(password, 10);
    // Por defecto el usuario se crea sin fecha_ingreso; debe ser asignada por RH
    const fechaIngreso = req.body.fecha_ingreso || '2000-01-01';
    const usuario = await Usuario.create({
      nombre,
      email,
      password: hashed,
      rol: 'trabajador',
      secciones: ['solicitudes_propias'],
      fecha_ingreso: fechaIngreso
    });
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente. Un administrador debe asignar tus datos laborales.',
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        secciones: usuario.secciones,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        secciones: usuario.secciones
      }
    });
  } catch (err) {
    next(err);
  }
};

// Restablecer la contraseña (por email)
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'email y newPassword son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.password = await bcrypt.hash(newPassword, 10);
    await usuario.save();

    res.status(200).json({ message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al resetear la contraseña', error });
  }
};

// Registro de usuario (solicita acceso; un admin debe asignar datos laborales)... (resto del código sin cambios)
