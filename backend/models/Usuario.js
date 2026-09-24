const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('trabajador', 'RRHH', 'administrador'),
    defaultValue: 'trabajador'
  },
  // Secciones a las que tiene acceso (almacenado como JSON)
  secciones: {
    type: DataTypes.JSON,
    defaultValue: ['solicitudes_propias']
  },
  numero_trabajador: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  nss: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: true
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuarios',
  timestamps: false
});

module.exports = Usuario;
