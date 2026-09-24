const Usuario = require('./Usuario');
const ControlVacaciones = require('./ControlVacaciones');
const HistorialAjusteDias = require('./HistorialAjusteDias');

// Definir asociaciones
Usuario.hasMany(ControlVacaciones, { foreignKey: 'trabajador_id', as: 'ControlVacaciones' });
ControlVacaciones.belongsTo(Usuario, { foreignKey: 'trabajador_id', as: 'trabajador' });

// Relación de HistorialAjusteDias
HistorialAjusteDias.belongsTo(Usuario, { foreignKey: 'modificado_por', as: 'Usuario' });

module.exports = { Usuario, ControlVacaciones, HistorialAjusteDias };