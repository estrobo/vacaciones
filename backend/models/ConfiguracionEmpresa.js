const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Configuración de identidad de la empresa para reportes y autorizaciones.
// Fila única/singleton (id = 1): nombre, subtítulo y logotipo (data URL base64).
const ConfiguracionEmpresa = sequelize.define(
  'ConfiguracionEmpresa',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(200), allowNull: true },
    subtitulo: { type: DataTypes.STRING(200), allowNull: true },
    // Logotipo guardado como data URL (data:image/png;base64,...) para persistirlo en BD
    logo: { type: DataTypes.TEXT, allowNull: true }
  },
  { tableName: 'configuracion_empresa', timestamps: false }
);

module.exports = ConfiguracionEmpresa;