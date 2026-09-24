require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelizeConfig;

if (dialect === 'sqlite') {
  // SQLite para desarrollo local (no requiere instalar un servidor de BD)
  sequelizeConfig = {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
    define: {
      // SQLite no soporta ENUM nativamente igual, pero sequelize lo emula
    }
  };
} else {
  // MySQL/PostgreSQL para producción
  sequelizeConfig = {
    host: process.env.DB_HOST || 'localhost',
    dialect: dialect,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'vacation_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  sequelizeConfig
);

module.exports = { sequelize };
