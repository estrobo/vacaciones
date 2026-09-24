const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const ControlVacaciones = require('../models/ControlVacaciones');
const { Op } = require('sequelize');
const { determinarCorteCorrespondiente, recalcularControl, contarDiasEntreFechas } = require('../services/vacationService');

/**
 * Crea descansos por cierre general de la empresa a cuenta de vacaciones.
 * Se seleccionan los trabajadores a los que se les aplicará.
 * Cada descanso se guarda como una solicitud con es_cierre_general = true y estatus aprobada.
 */
exports.crearCierreGeneral = async (req, res, next) => {
  try {
    const { trabajadores_ids, fecha_inicio, fecha_fin, descripcion } = req.body;
    if (!trabajadores_ids || !Array.isArray(trabajadores_ids) || trabajadores_ids.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un trabajador' });
    }
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Fecha de inicio y fin son obligatorias' });
    }

    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    if (fin < inicio) {
      return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio' });
    }

    // Días naturales inclusivos (misma fórmula que las solicitudes normales)
    const dias = contarDiasEntreFechas(fecha_inicio, fecha_fin);

    const creadas = [];
    const errores = [];

    for (const trabajadorId of trabajadores_ids) {
      const usuario = await Usuario.findByPk(trabajadorId);
      if (!usuario) { errores.push(`Trabajador ${trabajadorId} no encontrado`); continue; }

      const corteInfo = determinarCorteCorrespondiente(fecha_inicio, usuario.fecha_ingreso);

      let control = await ControlVacaciones.findOne({
        where: { trabajador_id: usuario.id, corte_anual: corteInfo.corteCorrespondiente, activo: true }
      });

      // Verificar si le quedan días suficientes
      if (control && control.dias_disponibles < dias) {
        errores.push(`${usuario.nombre}: días insuficientes (disponibles ${control.dias_disponibles})`);
        continue;
      }

      const solicitud = await Solicitud.create({
        trabajador_id: usuario.id,
        trabajador_nombre: usuario.nombre,
        trabajador_numero: usuario.numero_trabajador,
        dias_solicitados: dias,
        fecha_inicio,
        fecha_fin,
        corte_correspondiente: corteInfo.corteCorrespondiente,
        comentarios_rh: `Cierre general: ${descripcion || 'Descanso por cierre de empresa'}`,
        estatus: 'aprobada',
        es_cierre_general: true,
        revisado_por: req.usuario.id,
        fecha_revision: new Date()
      });
      creadas.push(solicitud);

      if (control) await recalcularControl(control.id);
    }

    res.status(201).json({
      mensaje: `Cierre general aplicado a ${creadas.length} trabajador(es)`,
      creadas: creadas.length,
      errores
    });
  } catch (err) {
    next(err);
  }
};
