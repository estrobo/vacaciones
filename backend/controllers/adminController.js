const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const Usuario = require('../models/Usuario');

// Modelo para guardar configuración de correo
const { DataTypes } = require('sequelize');

// Nota: algunas limpiezas lógicas requieren cargar modelos dentro de funciones
// para evitar problemas de circular dependency.

const EmailConfig = sequelize.define(
  'EmailConfig',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    smtp_host: { type: DataTypes.STRING(200), allowNull: true },
    smtp_port: { type: DataTypes.INTEGER, allowNull: true },
    smtp_user: { type: DataTypes.STRING(200), allowNull: true },
    smtp_password: { type: DataTypes.STRING(500), allowNull: true },
    company_name: { type: DataTypes.STRING(200), allowNull: true },
    rrhh_recipients: { type: DataTypes.TEXT, allowNull: true } // JSON array string
  },
  { tableName: 'email_config', timestamps: false }
);

const databasePath = path.join(__dirname, '../../database.sqlite');
const backupsDir = path.join(__dirname, '../backups');
const cleanSnapshotPath = path.join(backupsDir, 'clean.db');

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
}

async function ensureEmailConfigTable() {
  await EmailConfig.sync();
}

exports.createBackup = async (req, res, next) => {
  try {
    ensureBackupsDir();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${ts}.db`;
    const dest = path.join(backupsDir, backupName);
    fs.copyFileSync(databasePath, dest);
    res.json({ mensaje: 'Backup creado', archivo: backupName });
  } catch (err) {
    next(err);
  }
};

exports.backup = async (req, res, next) => {
  try {
    // Descarga el último backup (clean si no hay)
    ensureBackupsDir();
    const files = fs.existsSync(backupsDir) ? fs.readdirSync(backupsDir).filter(f => f.endsWith('.db')) : [];
    files.sort();
    const chosen = files.length ? path.join(backupsDir, files[files.length - 1]) : cleanSnapshotPath;
    if (!fs.existsSync(chosen)) return res.status(404).json({ error: 'No hay backups para descargar' });
    res.download(chosen);
  } catch (err) {
    next(err);
  }
};

exports.restore = async (req, res, next) => {
  try {
    const { filename } = req.body || {};
    ensureBackupsDir();
    if (!filename) return res.status(400).json({ error: 'filename es requerido' });
    const src = path.join(backupsDir, filename);
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'Backup no encontrado' });
    fs.copyFileSync(src, databasePath);
    res.json({ mensaje: 'Restore completado' });
  } catch (err) {
    next(err);
  }
};

exports.restoreCleanTests = async (req, res, next) => {
  try {
    ensureBackupsDir();

    // 1) Restaura snapshot clean si existe, si no existe lo creamos a partir del estado actual.
    if (!fs.existsSync(cleanSnapshotPath)) {
      fs.copyFileSync(databasePath, cleanSnapshotPath);
    }

    fs.copyFileSync(cleanSnapshotPath, databasePath);

    // 2) Limpieza lógica adicional: borrar TODO historial de solicitudes
    // (pendiente, aprobada, rechazada, cancelada) para dejar BD realmente "limpia".
    const Solicitud = require('../models/Solicitud');
    const ControlVacaciones = require('../models/ControlVacaciones');

    await Solicitud.destroy({ where: {}, truncate: true });

    // Recalcular controles: ponemos dias_pendientes en 0 y recalculamos dias_disponibles
    const controles = await ControlVacaciones.findAll();
    for (const c of controles) {
      c.dias_pendientes = 0;
      c.dias_disponibles = (c.dias_asignados || 0) - (c.dias_usados || 0) - (c.dias_pendientes || 0);
      if (c.dias_disponibles < 0) c.dias_disponibles = 0;
      await c.save();
    }

    res.json({ mensaje: 'Restore clean (solicitudes borradas) completado' });
  } catch (err) {
    next(err);
  }
};

exports.getEmailConfig = async (req, res, next) => {
  try {
    await ensureEmailConfigTable();
    const cfg = await EmailConfig.findOne({ where: { id: { [Op.ne]: null } }, order: [['id', 'DESC']] });
    res.json(cfg || {});
  } catch (err) {
    next(err);
  }
};

exports.setEmailConfig = async (req, res, next) => {
  try {
    await ensureEmailConfigTable();

    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      company_name,
      rrhh_recipients
    } = req.body || {};

    // rrhh_recipients puede venir como string o array
    let rrhhStr = rrhh_recipients;
    if (Array.isArray(rrhh_recipients)) rrhhStr = JSON.stringify(rrhh_recipients);

    await EmailConfig.create({
      smtp_host: smtp_host || null,
      smtp_port: smtp_port || null,
      smtp_user: smtp_user || null,
      smtp_password: smtp_password || null,
      company_name: company_name || null,
      rrhh_recipients: rrhhStr || null
    });

    res.json({ mensaje: 'Config de correo guardada' });
  } catch (err) {
    next(err);
  }
};

// Enviar correo de prueba usando la configuración guardada
exports.emailTest = async (req, res, next) => {
  try {
    const { to, subject, body } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Campo "to" es requerido' });

    const { enviarCorreoPrueba } = require('../services/emailService');
    const result = await enviarCorreoPrueba({
      to,
      subject: subject || 'Prueba de notificaciones de vacaciones',
      body: body || 'Este es un correo de prueba para verificar que el envío de notificaciones está funcionando.'
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    return next(err);
  }
};
