// Migración: doble autorización de RH
// - solicitudes: + autorizado_por_1, fecha_autorizacion_1
// - configuracion_empresa: + requiere_doble_autorizacion
// Uso: node backend/migrations/migrate_doble_autorizacion.js
require('dotenv').config();
const { sequelize } = require('../config/database');

async function columnaExiste(tabla, columna) {
  const [cols] = await sequelize.query(`PRAGMA table_info(${tabla})`);
  return cols.some(c => c.name === columna);
}

(async () => {
  if (!(await columnaExiste('solicitudes', 'autorizado_por_1'))) {
    await sequelize.query(`ALTER TABLE solicitudes ADD COLUMN autorizado_por_1 INTEGER NULL`);
    console.log('solicitudes.autorizado_por_1 agregada');
  }
  if (!(await columnaExiste('solicitudes', 'fecha_autorizacion_1'))) {
    await sequelize.query(`ALTER TABLE solicitudes ADD COLUMN fecha_autorizacion_1 DATETIME NULL`);
    console.log('solicitudes.fecha_autorizacion_1 agregada');
  }
  if (!(await columnaExiste('configuracion_empresa', 'requiere_doble_autorizacion'))) {
    await sequelize.query(`ALTER TABLE configuracion_empresa ADD COLUMN requiere_doble_autorizacion INTEGER NOT NULL DEFAULT 0`);
    console.log('configuracion_empresa.requiere_doble_autorizacion agregada');
  }
  await sequelize.close();
  console.log('Migración completada.');
})().catch(err => { console.error(err); process.exit(1); });
