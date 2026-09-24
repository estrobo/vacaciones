// Vista: Configuración de días por antigüedad
async function vistaConfiguracion() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Configuración de días');
  const content = document.getElementById('page-content');

  content.innerHTML = `<div id="config-content"><div class="loading"><div class="spinner"></div></div></div>`;
  const cont = document.getElementById('config-content');

  try {
    const res = await API.listarConfig();
    cont.innerHTML = `
      <div class="card">
        <div class="card-header"><h3>Agregar/actualizar configuración</h3></div>
        <form id="config-form" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0;">
            <label>Antigüedad (años)</label>
            <input type="number" id="c-antiguedad" class="form-control" min="1" required style="width:140px;">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>Días asignados</label>
            <input type="number" id="c-dias" class="form-control" min="1" required style="width:140px;">
          </div>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3>Tabla de días por antigüedad</h3></div>
        <div class="table-wrapper"><table>
          <thead><tr><th>Años de antigüedad</th><th>Días de vacaciones</th><th>Acción</th></tr></thead>
          <tbody>
            ${res.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:var(--gray-500);">Sin configuración</td></tr>' :
              res.map(c => `<tr><td>${c.antiguedad} año(s)</td><td><strong>${c.dias_asignados}</strong> días</td><td><button class="btn btn-danger btn-sm" onclick="eliminarConfig(${c.id})">Eliminar</button></td></tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    `;

    document.getElementById('config-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = {
        antiguedad: parseInt(document.getElementById('c-antiguedad').value),
        dias_asignados: parseInt(document.getElementById('c-dias').value)
      };
      try {
        await API.guardarConfig(datos);
        utils.swal('Configuración guardada', 'success');
        vistaConfiguracion();
      } catch (err) { utils.swal(err.message, 'error'); }
    });
  } catch (err) {
    cont.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
  }
}

window.eliminarConfig = async function(id) {
  if (!confirm('¿Eliminar esta configuración?')) return;
  try {
    await API.eliminarConfig(id);
    utils.swal('Configuración eliminada', 'success');
    vistaConfiguracion();
  } catch (err) { utils.swal(err.message, 'error'); }
};
