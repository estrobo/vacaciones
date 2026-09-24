const nodemailer = require('nodemailer');
require('dotenv').config();

// Crear transportador de correo
let transporter = null;
let lastConfigKey = null;

function getTransporter(config = null) {
  // config puede traer: smtp_host, smtp_port, smtp_user, smtp_password
  const key = config
    ? `${config.smtp_host || ''}:${config.smtp_port || ''}:${config.smtp_user || ''}`
    : 'env';

  if (transporter && lastConfigKey === key) return transporter;
  lastConfigKey = key;

  const smtpHost = config?.smtp_host || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(config?.smtp_port || process.env.EMAIL_PORT || '587', 10);
  const smtpUser = config?.smtp_user || process.env.EMAIL_USER;
  const smtpPass = config?.smtp_password || process.env.EMAIL_PASSWORD;

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  return transporter;
}

// Normaliza destinatarios RRHH guardados como JSON en BD
function parseRecipients(rrhh_recipients) {
  if (!rrhh_recipients) return [];
  try {
    if (Array.isArray(rrhh_recipients)) return rrhh_recipients;
    const asJson = JSON.parse(rrhh_recipients);
    if (Array.isArray(asJson)) return asJson;
  } catch (_) {}
  // fallback: separadas por coma
  return String(rrhh_recipients)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function empresaNombreFromConfig(company_name) {
  return company_name || process.env.EMPRESA_NOMBRE || 'Recursos Humanos';
}

async function getLatestEmailConfig(EmailConfig) {
  // EmailConfig se pasa para evitar require circular temprano
  await EmailConfig.sync();
  const cfg = await EmailConfig.findOne({
    where: {},
    order: [['id', 'DESC']]
  });
  return cfg ? cfg.toJSON() : null;
}

// Enviar notificación a un trabajador sobre el estatus de su solicitud
async function notificarEstatusSolicitud(solicitud, trabajador) {
  // Cargar config de BD si existe
  let EmailConfigModel = null;
  let cfg = null;
  try {
    const { sequelize } = require('../config/database');
    const { DataTypes } = require('sequelize');
    EmailConfigModel = sequelize.define('EmailConfig', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      smtp_host: { type: DataTypes.STRING(200), allowNull: true },
      smtp_port: { type: DataTypes.INTEGER, allowNull: true },
      smtp_user: { type: DataTypes.STRING(200), allowNull: true },
      smtp_password: { type: DataTypes.STRING(500), allowNull: true },
      company_name: { type: DataTypes.STRING(200), allowNull: true },
      rrhh_recipients: { type: DataTypes.TEXT, allowNull: true }
    }, { tableName: 'email_config', timestamps: false, freezeTableName: true });

    cfg = await getLatestEmailConfig(EmailConfigModel);
  } catch (_) {
    cfg = null;
  }

  const asuntos = {
    pendiente: 'Solicitud de vacaciones recibida',
    aprobada: '¡Tu solicitud de vacaciones ha sido APROBADA!',
    rechazada: 'Tu solicitud de vacaciones ha sido rechazada',
    cancelada: 'Tu solicitud de vacaciones ha sido cancelada'
  };
  const asunto = asuntos[solicitud.estatus] || 'Actualización de solicitud de vacaciones';

  const companyName = empresaNombreFromConfig(cfg?.company_name);

  const cuerpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">${companyName}</h2>
      <p>Hola <strong>${trabajador.nombre}</strong>,</p>
      <p>Te informamos que el estatus de tu solicitud de vacaciones es: <strong>${solicitud.estatus.toUpperCase()}</strong></p>
      <div style="background: #f4f6f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Días solicitados:</strong> ${solicitud.dias_solicitados}</p>
        <p style="margin: 5px 0;"><strong>Fecha de inicio:</strong> ${solicitud.fecha_inicio}</p>
        <p style="margin: 5px 0;"><strong>Fecha de fin:</strong> ${solicitud.fecha_fin}</p>
        ${solicitud.comentarios_rh ? `<p style="margin: 5px 0;"><strong>Comentarios de RH:</strong> ${solicitud.comentarios_rh}</p>` : ''}
      </div>
      <p>Puedes revisar más detalles iniciando sesión en el sistema.</p>
      <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">Este es un correo automático, no respondas a este mensaje.</p>
    </div>
  `;

  try {
    const transport = getTransporter(cfg);
    await transport.sendMail({
      from: `"${companyName}" <${cfg?.smtp_user || process.env.EMAIL_USER}>`,
      to: trabajador.email,
      subject: asunto,
      html: cuerpo
    });
    console.log(`Notificación enviada a ${trabajador.email}`);
  } catch (err) {
    console.error('Error al enviar correo:', err.message);
  }
}

// Notificar a RH/Admin sobre nueva solicitud
async function notificarNuevaSolicitudARH(solicitud, trabajador, destinatariosRH) {
  // Si viene destinatariosRH desde controller úsalo; si no, usa configuración DB
  let cfg = null;
  try {
    const { sequelize } = require('../config/database');
    const { DataTypes } = require('sequelize');
    const EmailConfigModel = sequelize.define('EmailConfig', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      smtp_host: { type: DataTypes.STRING(200), allowNull: true },
      smtp_port: { type: DataTypes.INTEGER, allowNull: true },
      smtp_user: { type: DataTypes.STRING(200), allowNull: true },
      smtp_password: { type: DataTypes.STRING(500), allowNull: true },
      company_name: { type: DataTypes.STRING(200), allowNull: true },
      rrhh_recipients: { type: DataTypes.TEXT, allowNull: true }
    }, { tableName: 'email_config', timestamps: false, freezeTableName: true });

    cfg = await getLatestEmailConfig(EmailConfigModel);
  } catch (_) {
    cfg = null;
  }

  let rhEmails = destinatariosRH;
  if ((!rhEmails || rhEmails.length === 0) && cfg?.rrhh_recipients) {
    rhEmails = parseRecipients(cfg.rrhh_recipients);
  }
  if (!rhEmails || rhEmails.length === 0) return;

  const companyName = empresaNombreFromConfig(cfg?.company_name);

  const cuerpo = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Nueva solicitud de vacaciones para revisión</h2>
      <p>Hay una nueva solicitud de vacaciones que requiere tu atención.</p>
      <div style="background: #f4f6f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Trabajador:</strong> ${trabajador.nombre}</p>
        <p style="margin: 5px 0;"><strong>Número de trabajador:</strong> ${trabajador.numero_trabajador || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Días solicitados:</strong> ${solicitud.dias_solicitados}</p>
        <p style="margin: 5px 0;"><strong>Fecha de inicio:</strong> ${solicitud.fecha_inicio}</p>
        <p style="margin: 5px 0;"><strong>Fecha de fin:</strong> ${solicitud.fecha_fin}</p>
      </div>
      <p>Ingresa al sistema para revisar y autorizar o rechazar la solicitud.</p>
      <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">Este es un correo automático, no respondas a este mensaje.</p>
    </div>
  `;

  try {
    const transport = getTransporter(cfg);
    await transport.sendMail({
      from: `"${companyName}" <${cfg?.smtp_user || process.env.EMAIL_USER}>`,
      to: rhEmails.join(', '),
      subject: `Nueva solicitud de vacaciones - ${trabajador.nombre}`,
      html: cuerpo
    });
    console.log(`Notificación de nueva solicitud enviada a RH`);
  } catch (err) {
    console.error('Error al enviar correo a RH:', err.message);
  }
}

async function enviarCorreoPrueba({ to, subject, body }) {
  // Construye una configuración desde BD si existe.
  let EmailConfigModel = null;
  let cfg = null;

  try {
    const { sequelize } = require('../config/database');
    const { DataTypes } = require('sequelize');
    EmailConfigModel = sequelize.define(
      'EmailConfig',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        smtp_host: { type: DataTypes.STRING(200), allowNull: true },
        smtp_port: { type: DataTypes.INTEGER, allowNull: true },
        smtp_user: { type: DataTypes.STRING(200), allowNull: true },
        smtp_password: { type: DataTypes.STRING(500), allowNull: true },
        company_name: { type: DataTypes.STRING(200), allowNull: true },
        rrhh_recipients: { type: DataTypes.TEXT, allowNull: true }
      },
      { tableName: 'email_config', timestamps: false, freezeTableName: true }
    );

    await EmailConfigModel.sync();
    cfg = await EmailConfigModel.findOne({ order: [['id', 'DESC']] });
    cfg = cfg ? cfg.toJSON() : null;
  } catch (_) {
    cfg = null;
  }

  const transport = getTransporter(cfg);
  const companyName = empresaNombreFromConfig(cfg?.company_name);

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color:#2c3e50;">${companyName}</h2>
    <p>${body}</p>
    <p style="color:#7f8c8d;font-size:12px;">Este correo es una prueba.</p>
  </div>`;

  await transport.sendMail({
    from: `"${companyName}" <${cfg?.smtp_user || process.env.EMAIL_USER}>`,
    to,
    subject: subject || 'Prueba de correo',
    html
  });

  return { to, subject: subject || null };
}

module.exports = { notificarEstatusSolicitud, notificarNuevaSolicitudARH, enviarCorreoPrueba };
