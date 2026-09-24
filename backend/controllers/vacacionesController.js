const ControlVacaciones = require('../models/ControlVacaciones');
const Usuario = require('../models/Usuario');
const Solicitud = require('../models/Solicitud');
const HistorialAjusteDias = require('../models/HistorialAjusteDias');
const { getControlVigente, recalcularControl } = require('../services/vacationService');

// Ver histórico de vacaciones de un trabajador específico
exports.historicoTrabajador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trabajador = await Usuario.findByPk(id);
    if (!trabajador) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const controles = await ControlVacaciones.findAll({
      where: { trabajador_id: id },
      order: [['corte_anual', 'DESC']]
    });

    // Historial completo de solicitudes del trabajador (incluye canceladas)
    const historial = await Solicitud.findAll({
      where: { trabajador_id: id },
      order: [['fecha_inicio', 'DESC'], ['id', 'DESC']]
    });

    res.json({
      trabajador: {
        id: trabajador.id,
        nombre: trabajador.nombre,
        numero_trabajador: trabajador.numero_trabajador,
        fecha_ingreso: trabajador.fecha_ingreso
      },
      controles,
      historial
    });
  } catch (err) {
    next(err);
  }
};

// Ajustar días disponibles manualmente
exports.ajustarDiasDisponibles = async (req, res, next) => {
  const { trabajadorId, dias } = req.body;
  try {
    const result = await getControlVigente(trabajadorId);
    const control = result && result.control;

    if (!control) {
      return res.status(404).json({ error: 'Control de vacaciones no encontrado' });
    }

    // Registrar los días de ajuste y su autor
    const datosHistorial = {
      modificado_por: req.usuario.id,
      trabajador_id: trabajadorId,
      corte_anual: control.corte_anual,
      dias_anterior: control.dias_disponibles,
      dias_nuevo: dias,
    };
    await HistorialAjusteDias.create(datosHistorial);

    control.dias_disponibles = Math.max(0, dias);
    await control.save();

    return res.json({ mensaje: 'Días disponibles actualizados correctamente', control });
  } catch (err) {
    next(err);
  }
};

// Recalcular días disponibles de un trabajador (manual)
exports.recalcular = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await getControlVigente(id);
    if (!result) return res.status(404).json({ error: 'Control no encontrado' });

    // Lógica para recalcular el control
    const control = await recalcularControl(result.control.id);
    return res.json({ mensaje: 'Control recalculado exitosamente', control });
  } catch (err) {
    next(err);
  }
};

// Historial de ajustes de días disponibles
exports.historialAjustes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const ajustes = await HistorialAjusteDias.findAndCountAll({
      limit,
      offset,
      order: [['fecha_ajuste', 'DESC']],
      include: [{ model: Usuario, as: 'Usuario', attributes: ['nombre', 'id'] }],  // Incluir quién hizo el ajuste
    });

    const totalPaginas = Math.ceil(ajustes.count / limit);
    res.json({
      total: ajustes.count,
      totalPaginas,
      ajustes: ajustes.rows,
    });
  } catch (error) {
    next(error);
  }
};