const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const ControlVacaciones = require('../models/ControlVacaciones');
const { Op } = require('sequelize');
const {
  determinarCorteCorrespondiente,
  getControlVigente,
  recalcularControl,
  contarDiasEntreFechas
} = require('../services/vacationService');
const { notificarEstatusSolicitud, notificarNuevaSolicitudARH } = require('../services/emailService');

// Trabajador: crear una solicitud de vacaciones
exports.crear = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, comentarios } = req.body;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Fecha de inicio y fin son obligatorias' });
    }
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    if (fin < inicio) {
      return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio' });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const dias = contarDiasEntreFechas(inicio, fin);

    // ====== VALIDACIÓN HARD: bloqueo de traslape (inclusive) ======
    // Solo bloquea con solicitudes pendientes o aprobadas (la cancelada no interfiere)
    const trabajadorId = usuario.id;
    const fechaInicioNorm = new Date(inicio).toISOString().slice(0, 10);
    const fechaFinNorm = new Date(fin).toISOString().slice(0, 10);

    const solicitudesBloqueantes = await Solicitud.findAll({
      where: {
        trabajador_id: trabajadorId,
        estatus: { [Op.in]: ['pendiente', 'aprobada'] }
      },
      attributes: ['fecha_inicio', 'fecha_fin']
    });

    const hayTraslape = solicitudesBloqueantes.some(s => {
      const ini2 = s.fecha_inicio ? new Date(s.fecha_inicio).toISOString().slice(0, 10) : null;
      const fin2 = s.fecha_fin ? new Date(s.fecha_fin).toISOString().slice(0, 10) : null;
      if (!ini2 || !fin2) return false;
      // Intersección inclusive: ini1 <= fin2 && fin1 >= ini2
      return fechaInicioNorm <= fin2 && fechaFinNorm >= ini2;
    });

    if (hayTraslape) {
      return res.status(400).json({
        error: 'No se puede crear la solicitud: hay traslape con otra solicitud pendiente/aprobada.'
      });
    }
    // ==============================================================

    // Determinar corte correspondiente (regla: días solicitados antes del corte van al corte pasado)
    const corteInfo = determinarCorteCorrespondiente(fecha_inicio, usuario.fecha_ingreso);

    let control = await ControlVacaciones.findOne({
      where: { trabajador_id: usuario.id, corte_anual: corteInfo.corteCorrespondiente, activo: true }
    });
    if (!control) {
      const vigente = await getControlVigente(usuario.id);
      control = vigente.control;
    }

    // Si la solicitud excede los días disponibles del trabajador, se marca como sin goce.
    // Importante: control.dias_disponibles es para el mismo corte_correspondiente.
    const sinGoce = control.dias_disponibles < dias;

    // Guardamos también cuántos días serían con goce (para reportes) y cuántos sin goce.
    const dias_con_goce = Math.min(dias, control.dias_disponibles);
    const dias_sin_goce = Math.max(0, dias - dias_con_goce);

    // Regla: si no hay días disponibles, **permitimos crear** la solicitud pero la marcamos.
    // En historial se verá resaltada; al aprobar se entiende que sería (parcialmente) sin goce.
    const solicitud = await Solicitud.create({
      trabajador_id: usuario.id,
      trabajador_nombre: usuario.nombre,
      trabajador_numero: usuario.numero_trabajador,
      dias_solicitados: dias,
      fecha_inicio: fecha_inicio,
      fecha_fin: fecha_fin,
      corte_correspondiente: corteInfo.corteCorrespondiente,
      comentarios_trabajador: comentarios || null,
      estatus: 'pendiente',
      sin_goce: sinGoce,
      dias_con_goce: dias_con_goce,
      dias_sin_goce: dias_sin_goce,
      es_cierre_general: false
    });

    // Preservar ajuste manual: el disponible se reduce solo por los días de ESTA solicitud,
    // sin recalcular desde dias_asignados (que ignoraría correcciones de RH).
    control.dias_pendientes += dias;
    control.dias_disponibles = Math.max(0, control.dias_disponibles - dias);
    await control.save();

    // Notificar a RRHH (solo rol RRHH) sobre la nueva solicitud
    const destinatariosRH = await Usuario.findAll({
      where: { rol: 'RRHH', activo: true },
      attributes: ['email']
    });
    notificarNuevaSolicitudARH(solicitud, usuario, destinatariosRH.map(u => u.email)).catch(console.error);

    res.status(201).json({ mensaje: 'Solicitud creada correctamente', solicitud });
  } catch (err) {
    next(err);
  }
};

// Trabajador: ver su historial de solicitudes (paginado y con filtros)
exports.misSolicitudes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { trabajador_id: req.usuario.id };
    if (req.query.estatus) where.estatus = req.query.estatus;
    if (req.query.fecha_inicio) where.fecha_inicio = { [Op.gte]: req.query.fecha_inicio };
    if (req.query.fecha_fin) where.fecha_fin = { [Op.lte]: req.query.fecha_fin };

    const { count, rows } = await Solicitud.findAndCountAll({
      where, limit, offset, order: [['fecha_creacion', 'DESC']]
    });

    res.json({
      data: rows,
      paginacion: { total: count, pagina: page, totalPaginas: Math.ceil(count / limit), limit }
    });
  } catch (err) {
    next(err);
  }
};

// RH/Admin: listar todas las solicitudes (paginadas y con filtros)
exports.listarTodas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.estatus) where.estatus = req.query.estatus;
    if (req.query.trabajador_id) where.trabajador_id = req.query.trabajador_id;
    if (req.query.es_cierre_general) where.es_cierre_general = req.query.es_cierre_general === 'true';
    if (req.query.fecha_inicio) where.fecha_inicio = { [Op.gte]: req.query.fecha_inicio };
    if (req.query.fecha_fin) where.fecha_fin = { [Op.lte]: req.query.fecha_fin };
    if (req.query.busqueda) {
      where[Op.or] = [
        { trabajador_nombre: { [Op.like]: `%${req.query.busqueda}%` } },
        { trabajador_numero: { [Op.like]: `%${req.query.busqueda}%` } }
      ];
    }

    const { count, rows } = await Solicitud.findAndCountAll({
      where, limit, offset, order: [['fecha_creacion', 'DESC']]
    });

    res.json({
      data: rows,
      paginacion: { total: count, pagina: page, totalPaginas: Math.ceil(count / limit), limit }
    });
  } catch (err) {
    next(err);
  }
};

// RH/Admin: aprobar o rechazar una solicitud
exports.revisar = async (req, res, next) => {
  try {
    const { estatus, comentarios } = req.body;
    if (!['aprobada', 'rechazada'].includes(estatus)) {
      return res.status(400).json({ error: 'Estatus debe ser "aprobada" o "rechazada"' });
    }
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.estatus !== 'pendiente') {
      return res.status(400).json({ error: 'La solicitud ya fue revisada' });
    }

    solicitud.estatus = estatus;
    solicitud.comentarios_rh = comentarios || null;
    solicitud.revisado_por = req.usuario.id;
    solicitud.fecha_revision = new Date();
    await solicitud.save();

    const control = await ControlVacaciones.findOne({
      where: { trabajador_id: solicitud.trabajador_id, corte_anual: solicitud.corte_correspondiente, activo: true }
    });
    if (control) await recalcularControl(control.id);

    const trabajador = await Usuario.findByPk(solicitud.trabajador_id);
    if (trabajador) notificarEstatusSolicitud(solicitud, trabajador).catch(console.error);

    res.json({ mensaje: `Solicitud ${estatus}`, solicitud });
  } catch (err) {
    next(err);
  }
};

// Obtener detalle de una solicitud
exports.detalle = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (req.usuario.rol === 'trabajador' && solicitud.trabajador_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta solicitud' });
    }

    const datos = solicitud.toJSON();
    // Anexar datos actuales del trabajador (NSS, CURP, fecha de ingreso) para
    // documentos como la autorización de vacaciones imprimible.
    try {
      const trabajador = await Usuario.findByPk(solicitud.trabajador_id, {
        attributes: ['nss', 'curp', 'fecha_ingreso']
      });
      if (trabajador) {
        datos.trabajador_nss = trabajador.nss;
        datos.trabajador_curp = trabajador.curp;
        datos.trabajador_fecha_ingreso = trabajador.fecha_ingreso;
      }
    } catch (e) {
      // Datos complementarios opcionales: si fallan, la solicitud aún puede imprimirse
    }

    res.json(datos);
  } catch (err) {
    next(err);
  }
};

// Trabajador: cancelar una solicitud pendiente propia
exports.cancelar = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.trabajador_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes cancelar una solicitud que no es tuya' });
    }
    if (solicitud.estatus !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar solicitudes pendientes' });
    }
    solicitud.estatus = 'cancelada';
    await solicitud.save();

    const control = await ControlVacaciones.findOne({
      where: { trabajador_id: solicitud.trabajador_id, corte_anual: solicitud.corte_correspondiente, activo: true }
    });
    if (control) await recalcularControl(control.id);

    res.json({ mensaje: 'Solicitud cancelada', solicitud });
  } catch (err) {
    next(err);
  }
};

// Admin: eliminar definitivamente una solicitud (solo administrador)
exports.eliminar = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const { trabajador_id, corte_correspondiente } = solicitud;
    await solicitud.destroy();

    // Recalcular el control para que días usados/pendientes sigan consistentes
    const control = await ControlVacaciones.findOne({
      where: { trabajador_id, corte_anual: corte_correspondiente, activo: true }
    });
    if (control) await recalcularControl(control.id);

    res.json({ mensaje: 'Solicitud eliminada definitivamente' });
  } catch (err) {
    next(err);
  }
};

