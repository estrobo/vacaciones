require('dotenv').config();
const { sequelize } = require('./config/database');
const Usuario = require('./models/Usuario');
const { getControlVigente, recalcularControl } = require('./services/vacationService');

(async () => {
  try {
    // 1. Crear un usuario nuevo hace 1 año
    const hoy = new Date();
    const haceUnAño = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());

    const [usuario] = await Usuario.findOrCreate({
      where: { numero_trabajador: 'WERO123' },
      defaults: {
        nombre: 'Wero Simulación',
        email: 'wero@falso.com',
        password: 'passwordfalsa123',
        fecha_ingreso: haceUnAño
      }
    });
    console.log('Usuario creado:', usuario.toJSON());

    // 2. Obtener o crear el control vigente con 12 días asignados por antigüedad
    const { control: controlInicial } = await getControlVigente(usuario.id);
    console.log('Control inicial:', controlInicial.toJSON());

    // 3. Simular una solicitud de 3 días
    const fechaInicio = controlInicial.corte_anual;
    const fechaFin = new Date(new Date(fechaInicio).setDate(new Date(fechaInicio).getDate() + 2)).toISOString().slice(0, 10);
    await sequelize.query(`INSERT INTO solicitudes (trabajador_id, trabajador_nombre, corte_correspondiente, dias_solicitados, dias_con_goce, estatus, fecha_inicio, fecha_fin) VALUES (${usuario.id}, 'Wero Simulación', '${controlInicial.corte_anual}', 3, 3, 'pendiente', '${fechaInicio}', '${fechaFin}')`);
    console.log('Solicitud de 3 días insertada.');

    // 4. Recalcular para reflejar días pendientes
    await recalcularControl(controlInicial.id);
    const controlPostSolicitud = await sequelize.models.ControlVacaciones.findByPk(controlInicial.id);
    console.log('Control tras solicitud:', controlPostSolicitud.toJSON());

    // 5. Cancelar la solicitud y verificar
    await sequelize.query(`UPDATE solicitudes SET estatus = 'cancelada' WHERE trabajador_id = ${usuario.id} AND corte_correspondiente = '${controlInicial.corte_anual}'`);
    await recalcularControl(controlInicial.id);
    const controlPostCancelacion = await sequelize.models.ControlVacaciones.findByPk(controlInicial.id);
    console.log('Control tras cancelación:', controlPostCancelacion.toJSON());

    // Limpieza (opcional):
    await sequelize.query(`DELETE FROM solicitudes WHERE trabajador_id = ${usuario.id}`);
    await sequelize.query(`DELETE FROM control_vacaciones WHERE trabajador_id = ${usuario.id}`);
    await usuario.destroy();
    console.log('Simulación limpia completada.');
    
    process.exit(0);
  } catch (e) {
    console.error('Error en simulación:', e);
    process.exit(1);
  }
})();