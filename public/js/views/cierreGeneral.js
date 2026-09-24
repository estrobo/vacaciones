// Vista: Cierre general (descansos a cuenta de vacaciones)
async function vistaCierreGeneral() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Cierre general');
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Aplicar descanso por cierre general</h3></div>
      <div class="filters-bar">
        <div class="form-group"><label>Trabajadores</label><div id="workers-select" class="workers-select"></div></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha inicio</label><input type="date" id="cg-inicio" class="form-control" required></div>
        <div class="form-group"><label>Fecha fin</label><input type="date" id="cg-fin" class="form-control" required></div>
      </div>
      <div class="form-group"><label>Descripción (opcional)</label><input type="text" id="cg-descripcion" class="form-control" placeholder="Ej. Cierre por mantenimiento"></div>
      <button class="btn btn-primary" id="cg-guardar">Aplicar a vacaciones</button>
      <div id="cg-error" style="margin-top:12px;"></div>
      <div id="cg-ok" style="margin-top:12px;"></div>
    </div>
  `;

  // Cargar lista de trabajadores
  const selector = document.getElementById('workers-select');
  selector.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const res = await API.listarUsuarios('?limit=1000&rol=trabajador&activo=true');
  selector.innerHTML = '';
  const trabajadores = res.data || [];

  const selected = new Set();
  if (trabajadores.length === 0) {
    selector.innerHTML = '<div class="empty-state">No hay trabajadores activos.</div>';
  } else {
    selector.innerHTML = trabajadores.map(w => `
      <div class="worker-check" onclick="toggleWorker(${w.id})">
        <input type="checkbox" id="w-${w.id}" ${selected.has(w.id) ? 'checked' : ''} />
        <span>${utils.escape(w.nombre)}</span>
      </div>
    `).join('');
  }

  window.toggleWorker = function(id) {
    const cb = document.getElementById(`w-${id}`);
    if (!cb) return;
    cb.checked = !cb.checked;
    if (cb.checked) selected.add(id); else selected.delete(id);
  };

  document.getElementById('cg-guardar').addEventListener('click', async () => {
    const trabajadores_ids = Array.from(selected);
    const fecha_inicio = document.getElementById('cg-inicio').value;
    const fecha_fin = document.getElementById('cg-fin').value;
    const descripcion = document.getElementById('cg-descripcion').value;
    const ok = document.getElementById('cg-ok');
    const err = document.getElementById('cg-error');
    ok.innerHTML = '';
    err.innerHTML = '';
    if (trabajadores_ids.length === 0) {
      err.innerHTML = '<div class="alert alert-error">Selecciona al menos un trabajador.</div>';
      return;
    }
    try {
      const res = await API.crearCierreGeneral({ trabajadores_ids, fecha_inicio, fecha_fin, descripcion });
      ok.innerHTML = `<div class="alert alert-success">${utils.escape(res.mensaje || 'Cierre general aplicado')}</div>`;
      if (res.errores && res.errores.length) {
        ok.innerHTML += '<div style="margin-top:12px;color:var(--gray-700)"><strong>Errores:</strong><ul>' + res.errores.map(e=>`<li>${utils.escape(e)}</li>`).join('') + '</ul></div>';
      }
    } catch (e) {
      err.innerHTML = `<div class="alert alert-error">${utils.escape(e.message)}</div>`;
    }
  });
}
