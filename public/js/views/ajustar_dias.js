async function vistaAjustarDias() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Ajuste de Días Disponibles');

  const content = document.getElementById('page-content');

  // Cargar trabajadores y sus días disponibles
  const res = await API.listarUsuariosDias();
  const trabajadores = res?.trabajadores || [];

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Ajuste de Días Disponibles</h3></div>
      <p class="text-muted" style="margin-top:-10px;">Edita los días disponibles. El sistema registrará el historial con paginación.</p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Días disponibles (vigente)</th>
              <th>Días asignados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tbody-trabajadores"></tbody>
        </table>
      </div>
      <div id="historial-ajustes" style="margin-top:20px;"></div>
      <div class="pagination" style="margin-top:12px;" id="historial-pag"></div>
    </div>
  `;

  const tbody = document.getElementById('tbody-trabajadores');
  tbody.innerHTML = trabajadores.map(t => {
    const raw = t.ControlVacaciones || t.ControlVacacione || null;
    const lista = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const vigente = lista.reduce((best, c) => !best || String(c.corte_anual) > String(best.corte_anual) ? c : best, null);
    const diasDisp = vigente?.dias_disponibles ?? 0;
    const diasAsig = vigente?.dias_asignados ?? 0;
    return `
      <tr>
        <td>${utils.escape(t.nombre || '')} <div><small>#${utils.escape(t.numero_trabajador || '')}</small></div></td>
        <td><strong>${diasDisp}</strong></td>
        <td>${diasAsig}</td>
        <td>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="number" min="0" step="1" id="input-dias-${t.id}" value="${diasDisp}" style="width:120px;" />
            <button class="btn btn-primary" onclick="guardarAjuste(${t.id})">Guardar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Cargar historial
  window.pageHist = 1;
  window.limitHist = 10;
  await cargarHistorial();
}

async function cargarHistorial() {
  const res = await API.request(`/vacaciones/historial?page=${window.pageHist}&limit=${window.limitHist}`);
  const ajustes = res.ajustes || [];

  const wrap = document.getElementById('historial-ajustes');
  const pag = document.getElementById('historial-pag');

  wrap.innerHTML = `
    <div class="card" style="padding:12px;">
      <h4 style="margin:0 0 10px;">Historial de cambios</h4>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Trabajador</th>
            <th>Anterior</th>
            <th>Nuevo</th>
            <th>Modificado por</th>
          </tr>
        </thead>
        <tbody>
          ${ajustes.length === 0 ? '<tr><td colspan="5">Sin historial</td></tr>' : ajustes.map(a => `
            <tr>
              <td>${utils.formatearFechaHora(a.fecha_ajuste)}</td>
              <td>#${utils.escape(a.trabajador_id)}</td>
              <td>${a.dias_anterior}</td>
              <td><strong>${a.dias_nuevo}</strong></td>
              <td>${utils.escape(a.Usuario?.nombre || a.modificado_por || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const totalPaginas = res.totalPaginas || 1;
  pag.innerHTML = `
    <button class="btn btn-outline" ${window.pageHist <= 1 ? 'disabled' : ''} onclick="window.pageHist=window.pageHist-1;cargarHistorial()">◀</button>
    <span style="margin:0 10px;">Página ${window.pageHist} de ${totalPaginas}</span>
    <button class="btn btn-outline" ${window.pageHist >= totalPaginas ? 'disabled' : ''} onclick="window.pageHist=window.pageHist+1;cargarHistorial()">▶</button>
  `;
}

window.cargarHistorial = cargarHistorial;

async function guardarAjuste(trabajadorId) {
  const input = document.getElementById(`input-dias-${trabajadorId}`);
  const dias = Number(input?.value);

  if (Number.isNaN(dias) || dias < 0) {
    utils.swal('Ingresa un número válido (>= 0)', 'error');
    return;
  }

  if (!confirm('¿Seguro que deseas guardar el nuevo valor de días disponibles?')) return;

  await API.request('/vacaciones/ajustar-dias', 'PUT', {
    trabajadorId,
    dias
  });

  utils.swal('Ajuste guardado correctamente', 'success');
  // Recargar tabla para reflejar el nuevo valor
  await vistaAjustarDias();
}

// Exportar la vista
window.vistaAjustarDias = vistaAjustarDias;