// Script de corrección ÚNICA: limpia "días fantasma" generados por el bug
// de recalcularControl (ajuste manual calculado contra base negativa).
// Regla: disponible_real = max(0, asignados - usados(con goce) - pendientes + ajusteManualReal)
// donde ajusteManualReal = suma de (dias_nuevo - dias_anterior) del historial de ajustes.
require('dotenv').config();
const { sequelize } = require('./config/database');
const ControlVacaciones = require('./models/ControlVacaciones');
const Solicitud = require('./models/Solicitud');
const HistorialAjusteDias = require('./models/HistorialAjusteDias');
const { Op } = require('sequelize');

(async () => {
  const controles = await ControlVacaciones.findAll({ where: { activo: true } });

  for (const control of controles) {
    const aprobadas = await Solicitud.findAll({
      where: { trabajador_id: control.trabajador_id, estatus: 'aprobada', corte_correspondiente: control.corte_anual }
    });
    const diasUsados = aprobadas.reduce((s, x) => s + (x.dias_con_goce || 0), 0);

    const pendientes = await Solicitud.findAll({
      where: { trabajador_id: control.trabajador_id, estatus: 'pendiente', corte_correspondiente: control.corte_anual }
    });
    const diasPendientes = pendientes.reduce((s, x) => s + (x.dias_solicitados || 0), 0);

    // El último ajuste manual fija el disponible de forma ABSOLUTA (no es delta).
    // Reconstrucción: último dias_nuevo - días consumidos por solicitudes creadas
    // DESPUÉS de ese ajuste. Si no hay ajustes, se usa la base automática.
    const ultimoAjuste = await HistorialAjusteDias.findOne({
      where: { trabajador_id: control.trabajador_id, corte_anual: control.corte_anual },
      order: [['fecha_ajuste', 'DESC'], ['id', 'DESC']]
    });

    let disponibleReal;
    if (ultimoAjuste) {
      const posteriores = await Solicitud.findAll({
        where: {
          trabajador_id: control.trabajador_id,
          corte_correspondiente: control.corte_anual,
          estatus: { [Op.in]: ['pendiente', 'aprobada'] },
          fecha_creacion: { [Op.gt]: ultimoAjuste.fecha_ajuste }
        }
      });
      const consumoPosterior = posteriores.reduce((s, x) =>
        s + (x.estatus === 'aprobada' ? (x.dias_con_goce || 0) : (x.dias_solicitados || 0)), 0);
      disponibleReal = Math.max(0, ultimoAjuste.dias_nuevo - consumoPosterior);
    } else {
      disponibleReal = Math.max(0, control.dias_asignados - diasUsados - diasPendientes);
    }

    if (disponibleReal !== control.dias_disponibles || diasUsados !== control.dias_usados || diasPendientes !== control.dias_pendientes) {
      console.log(`Corrigiendo trabajador ${control.trabajador_id} corte ${control.corte_anual}: disponibles ${control.dias_disponibles} -> ${disponibleReal} (usados ${control.dias_usados}->${diasUsados}, pendientes ${control.dias_pendientes}->${diasPendientes}, base ${ultimoAjuste ? 'ultimo ajuste ' + ultimoAjuste.dias_nuevo : 'automatica'})`);
      control.dias_usados = diasUsados;
      control.dias_pendientes = diasPendientes;
      control.dias_disponibles = disponibleReal;
      await control.save();
    } else {
      console.log(`OK trabajador ${control.trabajador_id} corte ${control.corte_anual}: sin cambios (${control.dias_disponibles} disponibles)`);
    }
  }

  await sequelize.close();
  console.log('Limpieza terminada.');
})().catch(err => { console.error(err); process.exit(1); });
