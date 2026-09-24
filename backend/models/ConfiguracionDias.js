const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Configuración de días asignados según antigüedad (años -> días)
const ConfiguracionDias = sequelize.define('ConfiguracionDias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  antiguedad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'Años de antigüedad'
  },
  dias_asignados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Días de vacaciones correspondientes'
  }
}, {
  tableName: 'configuracion_dias',
  timestamps: false
});

module.exports = ConfiguracionDias;
