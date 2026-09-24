// Vista: Nueva solicitud de vacaciones
async function vistaNuevaSolicitud() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Solicitar vacaciones');
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="card" style="max-width:600px;">
      <div class="card-header"><h3>Formulario de solicitud de vacaciones</h3></div>
      <div id="form-error"></div>
      <form id="solicitud-form">
        <div class="form-row">
          <div class="form-group">
            <label for="fecha_inicio">Fecha de inicio</label>
            <input type="date" id="fecha_inicio" class="form-control" min="${utils.hoy()}" required autofocus>
          </div>
          <div class="form-group">
            <label for="fecha_fin">Fecha de fin</label>
            <input type="date" id="fecha_fin" class="form-control" min="${utils.hoy()}" required>
          </div>
        </div>
        <div class="form-group">
          <label>Días a solicitar</label>
          <input type="text" id="dias" class="form-control" value="0" readonly style="background:var(--gray-50);">
          <small style="color:var(--gray-500);">Se calculan automáticamente según las fechas.</small>
        </div>
        <div class="form-group">
          <label for="comentarios">Comentarios (opcional)</label>
          <textarea id="comentarios" class="form-control" rows="3" placeholder="Motivo o detalles adicionales"></textarea>
        </div>
        <div class="form-group"><div id="dias-info"></div></div>
        <button type="submit" class="btn btn-primary">Enviar solicitud</button>
        <button type="button" class="btn btn-outline" onclick="router.navigate('/dashboard')">Cancelar</button>
      </form>
    </div>
  `;

  function calcularDias() {
    const fi = document.getElementById('fecha_inicio').value;
    const ff = document.getElementById('fecha_fin').value;
    const infoDiv = document.getElementById('dias-info');
    if (fi && ff) {
      const inicio = new Date(fi), fin = new Date(ff);
      if (fin < inicio) {
        document.getElementById('dias').value = 0;
        infoDiv.innerHTML = '<div class="alert alert-error">La fecha de fin no puede ser anterior a la de inicio</div>';
        return;
      }
      const diff = Math.floor((fin - inicio) / (1000*60*60*24)) + 1;
      document.getElementById('dias').value = diff;
      infoDiv.innerHTML = `<div class="alert alert-info">Días a solicitar: <strong>${diff}</strong>. Se debitarán del corte correspondiente.</div>`;
    }
  }
  document.getElementById('fecha_inicio').addEventListener('change', calcularDias);
  document.getElementById('fecha_fin').addEventListener('change', calcularDias);

  document.getElementById('solicitud-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
      comentarios: document.getElementById('comentarios').value,
    };
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Enviando...';
    try {
      await API.crearSolicitud(datos);
      utils.swal('Solicitud enviada correctamente', 'success');
      router.navigate('/mis-solicitudes');
    } catch (err) {
      document.getElementById('form-error').innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;

// Vista: Mis solicitudes (historial con filtros y paginación)
async function vistaMisSolicitudes() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Mis solicitudes');
  const content = document.getElementById('page-content');
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Historial de solicitudes</h3></div>
      <div class="filters-bar">
        <div class="form-group">
          <label>Estatus</label>
          <select id="f-estatus" class="form-control" onchange="page=1;cargarMisSolicitudes()">
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
        <div class="form-group"><label>Desde</label><input type="date" id="f-desde" class="form-control" onchange="page=1;cargarMisSolicitudes()"></div>
        <div class="form-group"><label>Hasta</label><input type="date" id="f-hasta" class="form-control" onchange="page=1;cargarMisSolicitudes()"></div>
        <div class="form-group"><button class="btn btn-outline" onclick="page=1;cargarMisSolicitudes()">Buscar</button></div>
      </div>
      <div id="mis-solicitudes-lista"></div>
      <div id="mis-solicitudes-pag"></div>
    </div>
  `;

  window.cargarMisSolicitudes = async function() {
    const lista = document.getElementById('mis-solicitudes-lista');
    lista.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const params = new URLSearchParams({ page, limit });
    const estatus = document.getElementById('f-estatus').value;
    const desde = document.getElementById('f-desde').value;
    const hasta = document.getElementById('f-hasta').value;
    if (estatus) params.append('estatus', estatus);
    if (desde) params.append('fecha_inicio', desde);
    if (hasta) params.append('fecha_fin', hasta);
    try {
      const res = await API.misSolicitudes('?' + params.toString());
      if (res.data.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>No se encontraron solicitudes con los filtros aplicados.</p></div>';

// Renderizar tabla de solicitudes
function renderTablaSolicitudes(data, esRH) {
  return `
    <div class="table-wrapper"><table>
      <thead><tr>
        ${esRH ? '<th>Trabajador</th>' : ''}
        <th>Fecha inicio</th><th>Fecha fin</th><th>Días</th><th>Corte</th>
        <th>Estatus</th><th>Solicitada</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${data.map(s => `
          <tr>
            ${esRH ? `<td>${utils.escape(s.trabajador_nombre)}<br><small>${utils.escape(s.trabajador_numero) || ''}</small></td>` : ''}
            <td>${utils.formatearFecha(s.fecha_inicio)}</td>
            <td>${utils.formatearFecha(s.fecha_fin)}</td>
            <td>${s.dias_solicitados}</td>
            <td>${utils.formatearFecha(s.corte_correspondiente)}</td>
            <td>${utils.badgeEstatus(s.estatus)}${s.es_cierre_general ? ' 🏢' : ''}</td>
            <td>${utils.formatearFechaHora(s.fecha_creacion)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="verSolicitud(${s.id})">Ver</button>
              ${s.estatus === 'pendiente' && !esRH ? `<button class="btn btn-danger btn-sm" onclick="cancelarSolicitud(${s.id})">Cancelar</button>` : ''}
              ${s.estatus === 'pendiente' && esRH ? `
                <button class="btn btn-success btn-sm" onclick="revisarSolicitud(${s.id},'aprobada')">Aprobar</button>
                <button class="btn btn-danger btn-sm" onclick="revisarSolicitud(${s.id},'rechazada')">Rechazar</button>` : ''}
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>
  `;
}

// Renderizar paginación
function renderPaginacion(containerId, pag, onChange) {
  const el = document.getElementById(containerId);
  if (!pag || pag.total === 0) { el.innerHTML = ''; return; }
  let botones = '';
  for (let i = 1; i <= pag.totalPaginas; i++) {
    botones += `<button class="page-btn ${i === pag.pagina ? 'active' : ''}" onclick="irPagina(${i})">${i}</button>`;
  }
  el.innerHTML = `
    <div class="pagination">
      <div class="pagination-info">${pag.total} resultado(s) - Página ${pag.pagina} de ${pag.totalPaginas}</div>
      <div class="pagination-controls">
        <button class="page-btn" ${pag.pagina <= 1 ? 'disabled' : ''} onclick="irPagina(${pag.pagina-1})">← Anterior</button>
        ${botones}
        <button class="page-btn" ${pag.pagina >= pag.totalPaginas ? 'disabled' : ''} onclick="irPagina(${pag.pagina+1})">Siguiente →</button>
      </div>
    </div>`;
  window.irPagina = onChange;
}

// Ver detalle de una solicitud
async function verSolicitud(id) {
  try {
    const s = await API.detalleSolicitud(id);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3>Detalle de solicitud #${s.id}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
        <div class="info-grid">
          <div class="info-item"><label>Trabajador</label><span>${utils.escape(s.trabajador_nombre)}</span></div>
          <div class="info-item"><label>Número de trabajador</label><span>${utils.escape(s.trabajador_numero) || 'N/A'}</span></div>
          <div class="info-item"><label>Fecha de inicio</label><span>${utils.formatearFecha(s.fecha_inicio)}</span></div>
          <div class="info-item"><label>Fecha de fin</label><span>${utils.formatearFecha(s.fecha_fin)}</span></div>
          <div class="info-item"><label>Días solicitados</label><span>${s.dias_solicitados}</span></div>
          <div class="info-item"><label>Corte correspondiente</label><span>${utils.formatearFecha(s.corte_correspondiente)}</span></div>
          <div class="info-item"><label>Estatus</label><span>${utils.badgeEstatus(s.estatus)}</span></div>
          <div class="info-item"><label>Solicitada</label><span>${utils.formatearFechaHora(s.fecha_creacion)}</span></div>
          ${s.comentarios_trabajador ? `<div class="info-item" style="grid-column:1/3;"><label>Comentarios del trabajador</label><span>${utils.escape(s.comentarios_trabajador)}</span></div>` : ''}
          ${s.comentarios_rh ? `<div class="info-item" style="grid-column:1/3;"><label>Comentarios de RH</label><span>${utils.escape(s.comentarios_rh)}</span></div>` : ''}
        </div>
        <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button></div>
      </div>`;
    document.body.appendChild(overlay);
  } catch (err) {
    utils.swal(err.message, 'error');
  }
}

// Cancelar solicitud

// Exponer funciones al scope global para el router
try {
  window.vistaNuevaSolicitud = vistaNuevaSolicitud;
  window.vistaMisSolicitudes = vistaMisSolicitudes;
  window.verSolicitud = verSolicitud;
  window.cancelarSolicitud = cancelarSolicitud;
  window.vistaPanelSolicitudes = vistaPanelSolicitudes;
  window.revisarSolicitud = revisarSolicitud;
  window.editarSolicitud = editarSolicitud;
} catch (e) {
  console.error('No se pudieron exportar vistas:', e);
}


async function cancelarSolicitud(id) {
  if (!confirm('¿Confirmas cancelar esta solicitud?')) return;
  try {
    await API.cancelarSolicitud(id);
    utils.swal('Solicitud cancelada', 'success');
    cargarMisSolicitudes();
  } catch (err) { utils.swal(err.message, 'error'); }
}

// Revisar solicitud (RH/Admin)
async function revisarSolicitud(id, estatus) {
  const comentario = estatus === 'rechazada' ? prompt('Motivo del rechazo (opcional):') || '' : '';
  if (!confirm(`¿Confirmas ${estatus === 'aprobada' ? 'APROBAR' : 'RECHAZAR'} esta solicitud?`)) return;
  try {
    await API.revisarSolicitud(id, { estatus, comentarios: comentario });
    utils.swal(`Solicitud ${estatus}`, 'success');
    cargarTodasSolicitudes();
  } catch (err) { utils.swal(err.message, 'error'); }
}

      } else {
        lista.innerHTML = renderTablaSolicitudes(res.data, false);
      }
      renderPaginacion('mis-solicitudes-pag', res.paginacion, (p) => { page = p; cargarMisSolicitudes(); });
    } catch (err) {
      lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
    }
  };
  cargarMisSolicitudes();
}

    } finally { btn.disabled = false; btn.textContent = 'Enviar solicitud'; }
  });
}
