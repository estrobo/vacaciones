const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Bitácora de ajustes manuales de días disponibles (solo lectura histórica)
const HistorialAjusteDias = sequelize.define('HistorialAjusteDias', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  modificado_por: { type: DataTypes.INTEGER, allowNull: false },   // id del usuario RRHH/Admin que hizo el cambio
  trabajador_id: { type: DataTypes.INTEGER, allowNull: false },    // id del trabajador ajustado
  corte_anual: { type: DataTypes.DATEONLY, allowNull: false },
  dias_anterior: { type: DataTypes.INTEGER, allowNull: false },
  dias_nuevo: { type: DataTypes.INTEGER, allowNull: false },
  fecha_ajuste: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'historial_ajuste_dias',
  timestamps: false
});

module.exports = HistorialAjusteDias;
