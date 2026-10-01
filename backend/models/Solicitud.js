const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');

const Solicitud = sequelize.define('Solicitud', {
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
  // Se guardan los datos del trabajador al momento de la solicitud
  trabajador_nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  trabajador_numero: {
    type: DataTypes.STRING(30)
  },
  trabajador_departamento: {
    type: DataTypes.STRING(100)
  },
  dias_solicitados: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // A qué corte anual corresponden los días (para no afectar el corte nuevo)
  corte_correspondiente: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha del corte anual al que pertenece esta solicitud'
  },
  estatus: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada'),
    defaultValue: 'pendiente'
  },
  comentarios_trabajador: {
    type: DataTypes.TEXT
  },
  comentarios_rh: {
    type: DataTypes.TEXT
  },
  revisado_por: {
    type: DataTypes.INTEGER,
    references: { model: 'usuarios', key: 'id' }
  },
  // Doble autorización de RH (cuando la empresa lo requiere):
  // guarda quién dio la PRIMERA autorización; la solicitud sigue 'pendiente'
  // hasta que OTRO usuario de RH/Admin dé la segunda.
  autorizado_por_1: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'usuarios', key: 'id' }
  },
  fecha_autorizacion_1: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // ¿La solicitud excede los días disponibles? (marcada como sin goce)
  sin_goce: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Días desglosados cuando el trabajador solicita más de lo disponible
  dias_con_goce: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  dias_sin_goce: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  fecha_revision: {
    type: DataTypes.DATE
  },
  // Si es cierre general (días de descanso por cierre de la empresa a cuenta de vacaciones)
  es_cierre_general: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'solicitudes',
  timestamps: false
});

Solicitud.belongsTo(Usuario, { foreignKey: 'trabajador_id', as: 'trabajador' });

module.exports = Solicitud;
