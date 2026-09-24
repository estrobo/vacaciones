const Usuario = require('../models/Usuario');
const ControlVacaciones = require('../models/ControlVacaciones');
const Solicitud = require('../models/Solicitud');

const { sequelize } = require('../config/database');

const { Op } = require('sequelize');
const { calcularAntiguedad, getControlVigente } = require('../services/vacationService');

// Listar usuarios con paginación y filtros (solo RH/admin)
// Lista usuarios con sus “días disponibles” actuales para ajuste (RRHH/Admin)
exports.listarConDiasDisponibles = async (req, res, next) => {
  try {
  
    const trabajadores = await Usuario.findAll({
      where: { activo: true },
      attributes: { exclude: ['password'] },
      include: [{
        model: ControlVacaciones,
        as: 'ControlVacaciones',
        where: { activo: true },
        required: false,
        attributes: [
          'id',
          'trabajador_id',
          'dias_disponibles',
          'dias_asignados',
          'dias_usados',
          'dias_pendientes',
          'corte_anual',
          'activo'
        ]
      }]
    });


    res.json({ trabajadores });
  } catch (err) {
    next(err);
  }
};
exports.listar = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.rol) where.rol = req.query.rol;
    if (req.query.activo) where.activo = req.query.activo === 'true';
    if (req.query.busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${req.query.busqueda}%` } },
        { email: { [Op.like]: `%${req.query.busqueda}%` } },
        { numero_trabajador: { [Op.like]: `%${req.query.busqueda}%` } }
      ];
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['nombre', 'ASC']]
    });

    const totalPaginas = Math.ceil(count / limit);
    res.json({
      data: rows,
      paginacion: { total: count, pagina: page, totalPaginas, limit }
    });
  } catch (err) {
    next(err);
  }
};

// Obtener un usuario por id
exports.obtener = async (req, res, next) => {
  
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    // El trabajador solo puede verse a sí mismo, RH/admin pueden ver a cualquiera
    if (req.usuario.rol === 'trabajador' && req.usuario.id !== usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
    }
    res.json(usuario);
  } catch (err) {
    next(err);
  }
};

// Actualizar rol, secciones y datos laborales (solo admin)
exports.actualizar = async (req, res, next) => {
  try {
    const { nombre, rol, secciones, numero_trabajador, nss, curp, fecha_ingreso, activo } = req.body;
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Solo un administrador puede otorgar o modificar el rol administrador
    const esAdmin = req.usuario.rol === 'administrador';
    if (rol && !esAdmin) {
      if (rol === 'administrador') {
        return res.status(403).json({ error: 'Solo un administrador puede asignar el rol administrador' });
      }
      if (usuario.rol === 'administrador') {
        return res.status(403).json({ error: 'No puedes cambiar el rol de un administrador' });
      }
    }

    if (nombre) usuario.nombre = nombre;
    if (rol) usuario.rol = rol;
    if (secciones) usuario.secciones = secciones;
    if (numero_trabajador !== undefined) usuario.numero_trabajador = numero_trabajador;
    if (nss !== undefined) usuario.nss = nss;
    if (curp !== undefined) usuario.curp = curp;
    if (fecha_ingreso) usuario.fecha_ingreso = fecha_ingreso;
    if (activo !== undefined) usuario.activo = activo;
    await usuario.save();

    const updated = usuario.get({ plain: true });
    delete updated.password;
    res.json({ mensaje: 'Usuario actualizado', usuario: updated });
  } catch (err) {
    next(err);
  }
};

// Eliminar (desactivar) usuario
exports.desactivar = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    usuario.activo = false;
    await usuario.save();
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) {
    next(err);
  }
};

// Admin: eliminar definitivamente un trabajador y todos sus datos (solo administrador)
exports.eliminarPermanente = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    await sequelize.transaction(async (t) => {
      await ControlVacaciones.destroy({ where: { trabajador_id: usuario.id }, transaction: t });
      await Solicitud.destroy({ where: { trabajador_id: usuario.id }, transaction: t });
      // Si este usuario revisó solicitudes, dejamos el campo sin dueño
      await Solicitud.update({ revisado_por: null }, { where: { revisado_por: usuario.id }, transaction: t });
      await usuario.destroy({ transaction: t });
    });

    res.json({ mensaje: 'Trabajador eliminado definitivamente junto con sus solicitudes y controles' });
  } catch (err) {
    next(err);
  }
};

// Dashboard del trabajador: días disponibles, usados, antigüedad, corte
exports.dashboardTrabajador = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const antiguedad = calcularAntiguedad(usuario.fecha_ingreso);
    const { control, corteVigente, corteSiguiente } = await getControlVigente(usuario.id);
    res.json({
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        numero_trabajador: usuario.numero_trabajador,
        fecha_ingreso: usuario.fecha_ingreso,
        antiguedad
      },
      vacaciones: {
        dias_asignados: control.dias_asignados,
        dias_usados: control.dias_usados,
        dias_pendientes: control.dias_pendientes,
        dias_disponibles: control.dias_disponibles,
        corte_vigente: control.corte_anual,
        corte_siguiente: corteSiguiente,
        antiguedad_corte: control.antiguedad_corte
      }
    });
  } catch (err) {
    next(err);
  }
};
