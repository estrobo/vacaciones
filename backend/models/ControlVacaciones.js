const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

// Control de vacaciones por corte anual
const ControlVacaciones = sequelize.define('ControlVacaciones', {
  id: {
    type: DataTypes.INTEGER,
   primaryKey: true,
    autoIncrement: true
  },
  trabajador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  dias_asignados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Días totales asignados para este corte según antigüedad'
  },
  dias_usados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Días ya tomados/aprobados en este corte'
  },
  dias_pendientes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Días en solicitudes pendientes de aprobación'
  },
  dias_disponibles: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Días disponibles para solicitar (asignados - usados - pendientes)'
  },
  // Fecha del aniversario / corte anual del trabajador
  corte_anual: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha del aniversario del trabajador (corte anual)'
  },
  // Antigüedad en años al momento de este corte
  antiguedad_corte: {
    type: DataTypes.INTEGER
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si este es el corte vigente'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'control_vacaciones',
  timestamps: false
});

module.exports = ControlVacaciones;
