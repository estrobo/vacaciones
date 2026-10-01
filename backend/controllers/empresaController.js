const ConfiguracionEmpresa = require('../models/ConfiguracionEmpresa');

const ID_UNICO = 1;

// Obtiene (y crea si no existe) la fila única de configuración de la empresa
async function obtenerRegistro() {
  let cfg = await ConfiguracionEmpresa.findByPk(ID_UNICO);
  if (!cfg) {
    cfg = await ConfiguracionEmpresa.create({
      id: ID_UNICO,
      nombre: 'Empresa XYZ',
      subtitulo: 'Recursos Humanos',
      logo: null
    });
  }
  return cfg;
}

// GET /api/empresa — cualquier usuario autenticado (RRHH/Admin imprimen reportes)
exports.obtener = async (req, res, next) => {
  try {
    const cfg = await obtenerRegistro();
    res.json({
      id: cfg.id,
      nombre: cfg.nombre,
      subtitulo: cfg.subtitulo,
      logo: cfg.logo || null,
      requiere_doble_autorizacion: !!cfg.requiere_doble_autorizacion
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/empresa — solo administrador
// `logo`: data URL de imagen para actualizarlo; null para borrarlo;
//         omitido para conservar el actual.
exports.guardar = async (req, res, next) => {
  try {
    const { nombre, subtitulo, logo, requiere_doble_autorizacion } = req.body || {};

    let logoFinal = null;
    if (logo !== undefined && logo !== null) {
      if (typeof logo !== 'string' || !logo.trim()) {
        return res.status(400).json({ error: 'El logotipo no es válido' });
      }
      const candidate = logo.trim();
      if (!/^data:image\//.test(candidate)) {
        return res.status(400).json({ error: 'El logotipo debe ser una imagen (data URL base64)' });
      }
      if (candidate.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'El logotipo es demasiado grande (máximo ~6MB)' });
      }
      logoFinal = candidate;
    }

    const cfg = await obtenerRegistro();
    cfg.nombre = (typeof nombre === 'string' && nombre.trim()) ? nombre.trim() : null;
    cfg.subtitulo = (typeof subtitulo === 'string' && subtitulo.trim()) ? subtitulo.trim() : null;
    if (logo === undefined) {
      // No se envió logo: conservar el actual
    } else if (logo === null) {
      // Se pidió quitar el logotipo
      cfg.logo = null;
    } else {
      cfg.logo = logoFinal;
    }
    if (requiere_doble_autorizacion !== undefined) {
      cfg.requiere_doble_autorizacion = !!requiere_doble_autorizacion;
    }
    await cfg.save();

    res.json({ mensaje: 'Configuración de empresa guardada' });
  } catch (err) {
    next(err);
  }
};