const ConfiguracionDias = require('../models/ConfiguracionDias');

// Listar toda la configuración de días por antigüedad
exports.listar = async (req, res, next) => {
  try {
    const configs = await ConfiguracionDias.findAll({ order: [['antiguedad', 'ASC']] });
    res.json(configs);
  } catch (err) {
    next(err);
  }
};

// Crear o actualizar una configuración
exports.crearOActualizar = async (req, res, next) => {
  try {
    const { antiguedad, dias_asignados } = req.body;
    if (antiguedad === undefined || dias_asignados === undefined) {
      return res.status(400).json({ error: 'Antigüedad y días asignados son obligatorios' });
    }
    let config = await ConfiguracionDias.findOne({ where: { antiguedad } });
    if (config) {
      config.dias_asignados = dias_asignados;
      await config.save();
    } else {
      config = await ConfiguracionDias.create({ antiguedad, dias_asignados });
    }
    res.status(201).json({ mensaje: 'Configuración guardada', config });
  } catch (err) {
    next(err);
  }
};

// Eliminar una configuración
exports.eliminar = async (req, res, next) => {
  try {
    const config = await ConfiguracionDias.findByPk(req.params.id);
    if (!config) return res.status(404).json({ error: 'Configuración no encontrada' });
    await config.destroy();
    res.json({ mensaje: 'Configuración eliminada' });
  } catch (err) {
    next(err);
  }
};
