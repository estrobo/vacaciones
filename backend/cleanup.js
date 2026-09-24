require('dotenv').config();
const { sequelize } = require('./config/database');
const { getControlVigente, recalcularControl } = require('./services/vacationService');

(async () => {
  // 1) Actualizar la solicitud pendiente (ID 2) al corte correcto (2026-09-02)
  await sequelize.query("UPDATE solicitudes SET corte_correspondiente = '2026-09-02' WHERE id = 2");
  console.log('Solicitud ID 2 ahora apunta al corte correcto (2026-09-02)');

  // 2) Eliminar el control viejo (ID 4) con fechas erróneas
  await sequelize.query("DELETE FROM control_vacaciones WHERE id = 4");
  console.log('Eliminado control ID 4 (corte 2026-09-01)');

  // 3) Crear control nuevo correcto
  const { control } = await getControlVigente(4);
  console.log('Nuevo control creado:', control.toJSON ? control.toJSON() : control);

  // 3.5) Re-aplicar el ajuste manual de RH (10 días en lugar de 12)
  const ControlVacaciones = require('./models/ControlVacaciones');
  await ControlVacaciones.update({ dias_disponibles: 10 }, { where: { id: control.id } });
  await control.reload();
  console.log('Ajuste manual re-aplicado: 10 días disponibles');

  // 4) Recalcular desde las solicitudes reales
  await recalcularControl(control.id);
  const [final] = await sequelize.query("SELECT * FROM control_vacaciones WHERE trabajador_id = 4 AND activo = 1");
  console.log('Control final:', final[0]);

  // 5) Eliminar historial inconsistente de Wero
  await sequelize.query("DELETE FROM historial_ajuste_dias WHERE trabajador_id = 4");
  console.log('Historial de ajustes de wero eliminado');

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });