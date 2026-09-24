const Usuario = require('../models/Usuario');
const ConfiguracionDias = require('../models/ConfiguracionDias');
const ControlVacaciones = require('../models/ControlVacaciones');
const Solicitud = require('../models/Solicitud');
const { Op } = require('sequelize');

// Parsea fecha como hora LOCAL (sin desfase UTC)
function parseFecha(f) {
  if (f instanceof Date) return f;
  const [y, m, d] = String(f).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formatea Date a YYYY-MM-DD en hora local
function fmtFecha(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Compatibilidad con código existente
function normalizarFecha(fecha) { return parseFecha(fecha); }

// Días naturales inclusivos entre dos fechas
function contarDiasEntreFechas(fechaInicio, fechaFin) {
  const inicio = parseFecha(fechaInicio);
  const fin = parseFecha(fechaFin);
  return Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
}

// Antigüedad en años cumplidos
function calcularAntiguedad(fechaIngreso) {
  const ingreso = parseFecha(fechaIngreso);
  const hoy = new Date();
  let a = hoy.getFullYear() - ingreso.getFullYear();
  const m = hoy.getMonth() - ingreso.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < ingreso.getDate())) a--;
  return Math.max(0, a);
}

// Determina el corte anual correspondiente a una fecha
function determinarCorteCorrespondiente(fechaSolicitud, fechaIngreso) {
  const ingreso = parseFecha(fechaIngreso);
  const fecha = parseFecha(fechaSolicitud);
  const año = fecha.getFullYear();
  const corteEsteAño = new Date(año, ingreso.getMonth(), ingreso.getDate());
  let corte, corteSiguiente;
  if (fecha >= corteEsteAño) {
    corte = corteEsteAño;
    corteSiguiente = new Date(año + 1, ingreso.getMonth(), ingreso.getDate());
  } else {
    corte = new Date(año - 1, ingreso.getMonth(), ingreso.getDate());
    corteSiguiente = corteEsteAño;
  }
  return { corteCorrespondiente: fmtFecha(corte), corteSiguiente: fmtFecha(corteSiguiente), antiguedadCorte: corte.getFullYear() - ingreso.getFullYear() };
}

// Calcula el corte vigente y siguiente para un trabajador
function calcularCorteVigente(fechaIngreso) {
  const hoy = new Date();
  const ingreso = parseFecha(fechaIngreso);
  const año = hoy.getFullYear();
  const corteEsteAño = new Date(año, ingreso.getMonth(), ingreso.getDate());
  let vigente, siguiente;
  if (hoy >= corteEsteAño) {
    vigente = corteEsteAño;
    siguiente = new Date(año + 1, ingreso.getMonth(), ingreso.getDate());
  } else {
    vigente = new Date(año - 1, ingreso.getMonth(), ingreso.getDate());
    siguiente = corteEsteAño;
  }
  return { corteVigente: fmtFecha(vigente), corteSiguiente: fmtFecha(siguiente), antiguedadCorte: vigente.getFullYear() - ingreso.getFullYear() };
}

// Días asignados según antigüedad desde configuración
async function getDiasPorAntiguedad(antiguedad) {
  const configs = await ConfiguracionDias.findAll({
    where: { antiguedad: { [Op.lte]: antiguedad } },
    order: [['antiguedad', 'DESC']],
    limit: 1
  });
  return configs.length > 0 ? configs[0].dias_asignados : 0;
}

// Obtiene o crea el control del corte vigente
// IMPORTANTE: NUNCA modifica dias_disponibles existentes (respeta ajustes manuales)
async function getControlVigente(trabajadorId) {
  const usuario = await Usuario.findByPk(trabajadorId);
  if (!usuario) { const e = new Error('Trabajador no encontrado'); e.status = 404; throw e; }

  const { corteVigente, corteSiguiente, antiguedadCorte } = calcularCorteVigente(usuario.fecha_ingreso);

  let control = await ControlVacaciones.findOne({
    where: { trabajador_id: trabajadorId, corte_anual: corteVigente, activo: true }
  });

  if (!control) {
    control = await ControlVacaciones.findOne({
      where: { trabajador_id: trabajadorId, activo: true },
      order: [['corte_anual', 'DESC']]
    });
    if (control) {
      control.corte_anual = corteVigente;
      control.antiguedad_corte = antiguedadCorte;
      await control.save();
    }
  }

  if (!control) {
    const dias = antiguedadCorte < 1 ? 0 : await getDiasPorAntiguedad(antiguedadCorte);
    control = await ControlVacaciones.create({
      trabajador_id: trabajadorId,
      dias_asignados: dias,
      dias_usados: 0,
      dias_pendientes: 0,
      dias_disponibles: dias,
      corte_anual: corteVigente,
      antiguedad_corte: antiguedadCorte,
      activo: true
    });
  }

  return { control, corteVigente, corteSiguiente };
}

// Recalcula desde las solicitudes reales, preservando ajustes manuales
async function recalcularControl(controlId) {
  const control = await ControlVacaciones.findByPk(controlId);
  if (!control) return null;

  const baseAutomatica = control.dias_asignados - control.dias_usados - control.dias_pendientes;
  const ajusteManual = control.dias_disponibles - baseAutomatica;

  const aprobadas = await Solicitud.findAll({
    where: { trabajador_id: control.trabajador_id, estatus: 'aprobada', corte_correspondiente: control.corte_anual }
  });
  const diasUsados = aprobadas.reduce((sum, s) => sum + (s.dias_con_goce || 0), 0);

  const pendientes = await Solicitud.findAll({
    where: { trabajador_id: control.trabajador_id, estatus: 'pendiente', corte_correspondiente: control.corte_anual }
  });
  const diasPendientes = pendientes.reduce((sum, s) => sum + (s.dias_solicitados || 0), 0);

  control.dias_usados = diasUsados;
  control.dias_pendientes = diasPendientes;
  control.dias_disponibles = Math.max(0, (control.dias_asignados - diasUsados - diasPendientes) + ajusteManual);

  await control.save();
  return control;
}

module.exports = {
  normalizarFecha,
  parseFecha,
  fmtFecha,
  calcularAntiguedad,
  getDiasPorAntiguedad,
  getControlVigente,
  recalcularControl,
  contarDiasEntreFechas,
  determinarCorteCorrespondiente,
  calcularCorteVigente
};