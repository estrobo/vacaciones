// RH/Admin (nuevo) - versión mínima

async function vistaPanelSolicitudes() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Panel de solicitudes');

  const content = document.getElementById('page-content');
  const esAdmin = usuario.rol === 'administrador';
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Solicitudes de vacaciones</h3></div>
      <div class="filters-bar">
        <div class="form-group"><label>Buscar</label><input type="text" id="f-busqueda" class="form-control" placeholder="Nombre o #" oninput="page=1;cargarTodasSolicitudes()"></div>
        <div class="form-group"><label>Estatus</label>
          <select id="f-estatus" class="form-control" onchange="page=1;cargarTodasSolicitudes()">
            <option value="">Todos</option><option value="pendiente">Pendientes</option><option value="aprobada">Aprobadas</option><option value="rechazada">Rechazadas</option><option value="cancelada">Canceladas</option>
          </select>
        </div>
        <div class="form-group"><label>Tipo</label>
          <select id="f-tipo" class="form-control" onchange="page=1;cargarTodasSolicitudes()">
            <option value="">Todas</option><option value="false">Solicitudes</option><option value="true">Cierres generales</option>
          </select>
        </div>
        <div class="form-group"><label>Desde</label><input type="date" id="f-desde" class="form-control" onchange="page=1;cargarTodasSolicitudes()"></div>
        <div class="form-group"><label>Hasta</label><input type="date" id="f-hasta" class="form-control" onchange="page=1;cargarTodasSolicitudes()"></div>
        <div class="form-group"><button class="btn btn-outline" onclick="page=1;cargarTodasSolicitudes()">Buscar</button></div>
      </div>
      <div id="todas-solicitudes-lista"></div>
      <div id="todas-solicitudes-pag"></div>
    </div>`;

function renderTablaSolicitudes(data, esRH, esAdmin = false) {
  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>${esRH ? '<th>Trabajador</th>' : ''}<th>Fecha inicio</th><th>Fecha fin</th><th>Días</th><th>Corte</th><th>Estatus</th><th>Días con goce</th><th>Días sin goce</th><th>Solicitada</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr class="${(item.dias_sin_goce || 0) > 0 ? 'row-sin-goce' : ''}">
              ${esRH ? `<td><div>${utils.escape(item.trabajador_nombre || '')}</div><small>#${utils.escape(item.trabajador_numero || '')}</small>${(item.dias_sin_goce || 0) > 0 ? '<div><span class="badge badge-danger">SIN GOCE</span></div>' : ''}</td>` : ''}
              <td>${utils.formatearFecha(item.fecha_inicio)}</td>
              <td>${utils.formatearFecha(item.fecha_fin)}</td>
              <td>${item.dias_solicitados}</td>
              <td>${utils.formatearFecha(item.corte_correspondiente)}</td>
              <td>${utils.badgeEstatus(item.estatus)}${item.es_cierre_general ? ' 🏢' : ''}</td>
              <td>${item.dias_con_goce || 0}</td>
              <td>${(item.dias_sin_goce || 0) > 0 ? `<strong class="text-danger">${item.dias_sin_goce}</strong> <span class="badge badge-danger">SIN GOCE</span>` : item.dias_sin_goce || 0}</td>
              <td>${utils.formatearFechaHora(item.fecha_creacion)}</td>
              <td>
                ${item.estatus === 'pendiente' && !item.es_cierre_general
                  ? `<button class="btn btn-small" onclick="window.abrirDecisionSolicitud(${item.id}, true)">Autorizar</button>
                     <button class="btn btn-small" onclick="window.abrirDecisionSolicitud(${item.id}, false)">Rechazar</button>`
                  : ''}
                ${item.estatus === 'aprobada' && !item.es_cierre_general
                  ? `<button class="btn btn-small" onclick="window.abrirDecisionSolicitud(${item.id}, false)">Revertir a pendiente</button>`
                  : ''}
                ${item.estatus === 'pendiente' || item.estatus === 'aprobada'
                  ? `<button class="btn btn-small" onclick="window.generarPDFAutorizacion(${item.id})">Imprimir autorización</button>`
                  : ''}
                ${esAdmin
                  ? `<button class="btn btn-small btn-danger" style="margin-left:6px;" onclick="window.eliminarSolicitudAdmin(${item.id})">Eliminar</button>`
                  : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}


  window.cargarTodasSolicitudes = async function () {
    const lista = document.getElementById('todas-solicitudes-lista');
    lista.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const params = new URLSearchParams({ page, limit });
    const busqueda = document.getElementById('f-busqueda').value;
    const estatus = document.getElementById('f-estatus').value;
    const tipo = document.getElementById('f-tipo').value;
    const desde = document.getElementById('f-desde').value;
    const hasta = document.getElementById('f-hasta').value;

    if (busqueda) params.append('busqueda', busqueda);
    if (estatus) params.append('estatus', estatus);
    if (tipo) params.append('es_cierre_general', tipo);
    if (desde) params.append('fecha_inicio', desde);
    if (hasta) params.append('fecha_fin', hasta);

    try {
      const res = await API.listarSolicitudes('?' + params.toString());
      lista.innerHTML = (!res.data || res.data.length === 0)
        ? '<div class="empty-state"><p>No se encontraron solicitudes.</p></div>'
        : renderTablaSolicitudes(res.data, true, esAdmin);
      if (typeof renderPaginacion === 'function') {
        renderPaginacion('todas-solicitudes-pag', res.paginacion, (p) => { page = p; cargarTodasSolicitudes(); });
      } else {
        // fallback simple si renderPaginacion no existe
        const pag=document.getElementById('todas-solicitudes-pag');
        const p=res.paginacion||{};
        const totalPaginas=p.totalPaginas||1;
        const total=p.total||(res.data?res.data.length:0);
        pag.innerHTML=`<div class="pagination-info">${total} resultado(s) - Página ${page} de ${totalPaginas}</div>`;
      }
    } catch (err) {
      lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
    }
  };

  // Admin: eliminar definitivamente una solicitud (solo administrador)
  window.eliminarSolicitudAdmin = async function(id){
    if(!confirm('¿Eliminar DEFINITIVAMENTE esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      await API.eliminarSolicitud(id);
      (utils.swal ? utils.swal('Solicitud eliminada','success') : alert('Solicitud eliminada'));
      cargarTodasSolicitudes();
    } catch (err) {
      (utils.swal ? utils.swal(err.message||String(err),'error') : alert(err.message||String(err)));
    }
  };

  window.cargarTodasSolicitudes();
}

async function vistaTrabajadores() {
  // Implementación mínima para que el módulo funcione.
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Trabajadores');

  const content = document.getElementById('page-content');
  const esAdmin = usuario.rol === 'administrador';
  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Lista de trabajadores</h3></div>
      <div class="card-body">
        <div class="form-group"><label>Buscar</label><input type="text" id="f-busqueda" class="form-control" placeholder="Nombre, email o #" oninput="page=1;window.__cargarTrabajadores();"></div>
        <div class="form-group"><label>Rol</label>
          <select id="f-rol" class="form-control" onchange="page=1;window.__cargarTrabajadores();">
            <option value="">Todos</option>
            <option value="trabajador">Trabajador</option>
            <option value="RRHH">RRHH</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <div id="trabajadores-lista"></div>
        <div id="trabajadores-pag" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  let page = 1;
  const limit = 10;

  // Acciones de trabajadores (1,2,3) conectadas a API
  window.editarTrabajador = async function(id){
    const u = utils || window.utils;
    const t = await API.obtenerUsuario(id);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Editar trabajador</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div id="edit-error"></div>
        <form id="edit-form">
          <div class="form-group"><label>Nombre</label><input id="e-nombre" class="form-control" value="${u.escape(t.nombre||'')}"></div>
          <div class="form-group"><label>Rol</label>
            ${esAdmin
              ? `<select id="e-rol" class="form-control">
                  <option value="trabajador" ${t.rol==='trabajador'?'selected':''}>Trabajador</option>
                  <option value="RRHH" ${t.rol==='RRHH'?'selected':''}>RRHH</option>
                  <option value="administrador" ${t.rol==='administrador'?'selected':''}>Administrador</option>
                </select>`
              : (t.rol === 'administrador'
                  ? `<input type="text" class="form-control" value="Administrador" disabled>
                     <small class="text-muted">Solo un administrador puede cambiar este rol.</small>`
                  : `<select id="e-rol" class="form-control">
                      <option value="trabajador" ${t.rol==='trabajador'?'selected':''}>Trabajador</option>
                      <option value="RRHH" ${t.rol==='RRHH'?'selected':''}>RRHH</option>
                    </select>`)}
          </div>
          <div class="form-group"><label>Activo</label>
            <select id="e-activo" class="form-control">
              <option value="true" ${t.activo?'selected':''}>Activo</option>
              <option value="false" ${!t.activo?'selected':''}>Inactivo</option>
            </select>
          </div>
          <div class="form-group"><label>Número trabajador</label><input id="e-num" class="form-control" value="${u.escape(t.numero_trabajador||'')}"></div>
          <div class="form-group"><label>NSS</label><input id="e-nss" class="form-control" value="${u.escape(t.nss||'')}"></div>
          <div class="form-group"><label>CURP</label><input id="e-curp" class="form-control" value="${u.escape(t.curp||'')}"></div>
          <div class="form-group"><label>Fecha ingreso</label><input id="e-ingreso" class="form-control" type="date" value="${t.fecha_ingreso||''}"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#edit-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const rolEl = overlay.querySelector('#e-rol');
        const datos = {
          nombre: overlay.querySelector('#e-nombre').value,
          activo: overlay.querySelector('#e-activo').value === 'true',
          numero_trabajador: overlay.querySelector('#e-num').value,
          nss: overlay.querySelector('#e-nss').value,
          curp: overlay.querySelector('#e-curp').value,
          fecha_ingreso: overlay.querySelector('#e-ingreso').value
        };
        // Solo se envía el rol cuando hay un <select> disponible (admin siempre;
        // RRHH ve solo Trabajador/RRHH y el rol de un administrador viene bloqueado)
        if (rolEl && rolEl.tagName === 'SELECT') datos.rol = rolEl.value;

        await API.actualizarUsuario(id, datos);
        u.swal ? u.swal('Trabajador actualizado','success') : alert('Trabajador actualizado');
        overlay.remove();
        window.__cargarTrabajadores();
      }catch(err){
        overlay.querySelector('#edit-error').innerHTML = `<div class="alert alert-error">${u.escape(err.message||String(err))}</div>`;
      }
    });
  };

  window.desactivarTrabajador = async function(id){
    const t = await API.obtenerUsuario(id);
    const accion = t.activo ? 'desactivar' : 'activar';
    if(!confirm(`¿Confirmas ${accion} a este trabajador?`)) return;

    // Si tu API no tiene endpoint dedicado, lo hacemos mediante actualizarUsuario (activo)
    await API.actualizarUsuario(id, { activo: !t.activo });
    (utils.swal ? utils.swal('Estado actualizado','success') : alert('Estado actualizado'));
    window.__cargarTrabajadores();
  };

  // Admin: eliminar definitivamente un trabajador (solo administrador)
  window.eliminarUsuarioAdmin = async function(id){
    if(!confirm('¿Eliminar DEFINITIVAMENTE a este trabajador?\nSe borrarán TODAS sus solicitudes, controles e historial. Esta acción NO se puede deshacer.')) return;
    if(!confirm('Última confirmación: ¿seguro que deseas eliminar todos los datos de este trabajador?')) return;
    try {
      await API.eliminarUsuario(id);
      (utils.swal ? utils.swal('Trabajador eliminado definitivamente','success') : alert('Trabajador eliminado definitivamente'));
      window.__cargarTrabajadores();
    } catch (err) {
      (utils.swal ? utils.swal(err.message||String(err),'error') : alert(err.message||String(err)));
    }
  };

  window.verHistoricoTrabajador = async function(id){
    const u = utils || window.utils;
    let res;
    try {
      res = await API.historicoTrabajador(id);
    } catch (err) {
      if (err.message.includes('No encontrado')) {
        utils.swal('Trabajador no encontrado', 'error');
        return;
      }
      throw err; // volver a lanzar por debug
    }

    const t = res.trabajador || {};
    const controles = res.controles || [];
    const historial = res.historial || [];
    const vigente = controles.find(c => c.activo) || controles[0] || null;

    // Resumen de días del corte vigente
    const resumen = vigente
      ? `<div class="stats-grid" style="margin:16px 0 4px;">
          <div class="stat-card"><div class="stat-label">Días asignados</div><div class="stat-value">${vigente.dias_asignados}</div></div>
          <div class="stat-card warning"><div class="stat-label">Días usados</div><div class="stat-value">${vigente.dias_usados}</div></div>
          <div class="stat-card"><div class="stat-label">Pendientes (en trámite)</div><div class="stat-value">${vigente.dias_pendientes}</div></div>
          <div class="stat-card success"><div class="stat-label">Disponibles (le quedan)</div><div class="stat-value">${vigente.dias_disponibles}</div></div>
        </div>
        <p class="text-muted" style="font-size:13px;margin:0 0 16px;">Corte vigente: ${u.formatearFecha(vigente.corte_anual)} · Antigüedad: ${vigente.antiguedad_corte ?? '—'} año(s)</p>`
      : '<div class="alert alert-info" style="margin:16px 0;">Este trabajador aún no tiene control de vacaciones asignado.</div>';

    const controlesHtml = controles.length === 0
      ? '<tr><td colspan="7" style="text-align:center;">Sin controles registrados.</td></tr>'
      : controles.map(c => `<tr>
          <td>${u.formatearFecha(c.corte_anual)}</td>
          <td>${c.antiguedad_corte != null ? c.antiguedad_corte + ' año(s)' : '—'}</td>
          <td>${c.dias_asignados}</td>
          <td>${c.dias_usados}</td>
          <td>${c.dias_pendientes}</td>
          <td><strong>${c.dias_disponibles}</strong></td>
          <td>${c.activo ? '<span class="badge badge-success">Vigente</span>' : ''}</td>
        </tr>`).join('');

    const historialHtml = historial.length === 0
      ? '<tr><td colspan="8" style="text-align:center;">Sin solicitudes registradas.</td></tr>'
      : historial.map(s => `<tr>
          <td>${u.formatearFecha(s.fecha_inicio)}</td>
          <td>${u.formatearFecha(s.fecha_fin)}</td>
          <td>${s.dias_solicitados}</td>
          <td>${s.dias_con_goce || 0}</td>
          <td>${(s.dias_sin_goce || 0) > 0 ? `<strong class="text-danger">${s.dias_sin_goce}</strong>` : (s.dias_sin_goce || 0)}</td>
          <td>${u.formatearFecha(s.corte_correspondiente)}</td>
          <td>${u.badgeEstatus ? u.badgeEstatus(s.estatus) : u.escape(s.estatus)}${s.es_cierre_general ? ' 🏢' : ''}</td>
          <td>${u.formatearFechaHora ? u.formatearFechaHora(s.fecha_creacion) : ''}</td>
        </tr>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:780px;">
        <div class="modal-header">
          <h3>Histórico y días - ${u.escape(t.nombre || '')}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="info-grid">
          <div class="info-item"><label>Número de trabajador</label><span>${u.escape(t.numero_trabajador) || 'N/A'}</span></div>
          <div class="info-item"><label>Fecha de ingreso</label><span>${t.fecha_ingreso ? u.formatearFecha(t.fecha_ingreso) : 'N/A'}</span></div>
        </div>

        ${resumen}

        <h4 style="margin:4px 0 8px;">Días por corte</h4>
        <div class="table-wrapper" style="margin-bottom:20px;">
          <table>
            <thead><tr><th>Corte anual</th><th>Antigüedad</th><th>Asignados</th><th>Usados</th><th>Pendientes</th><th>Disponibles</th><th>Vigente</th></tr></thead>
            <tbody>${controlesHtml}</tbody>
          </table>
        </div>

        <h4 style="margin:0 0 8px;">Historial de solicitudes</h4>
        <div class="table-wrapper" style="max-height:35vh;overflow:auto;">
          <table>
            <thead><tr><th>Inicio</th><th>Fin</th><th>Días</th><th>Con goce</th><th>Sin goce</th><th>Corte</th><th>Estatus</th><th>Creada</th></tr></thead>
            <tbody>${historialHtml}</tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" onclick="window.recalcularDiasTrabajador(${id})">Recalcular días</button>
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  // Recalcular control de días de un trabajador y reabrir el modal
  window.recalcularDiasTrabajador = async function(id){
    try {
      await API.recalcularVacaciones(id);
      (utils.swal ? utils.swal('Días recalculados','success') : alert('Días recalculados'));
      const ov = document.querySelector('.modal-overlay');
      if (ov) ov.remove();
      window.verHistoricoTrabajador(id);
    } catch (err) {
      (utils.swal ? utils.swal(err.message||String(err),'error') : alert(err.message||String(err)));
    }
  };

  window.__cargarTrabajadores = async () => {
    const lista = document.getElementById('trabajadores-lista');
    const pag = document.getElementById('trabajadores-pag');

    const busqueda = document.getElementById('f-busqueda').value || '';
    const rol = document.getElementById('f-rol').value || '';

    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (busqueda) params.append('busqueda', busqueda);
    if (rol) params.append('rol', rol);

    lista.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const res = await API.listarUsuarios('?' + params.toString());
      const data = res.data || [];

      if (data.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>No se encontraron trabajadores.</p></div>';
        pag.innerHTML = '';
        return;
      }

      lista.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Fecha ingreso</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(u => `
              <tr>
                <td>${u.numero_trabajador || ''}</td>
                <td>${utils.escape(u.nombre || '')}</td>
                <td>${utils.escape(u.email || '')}</td>
                <td>${utils.escape(u.rol || '')}</td>
                <td>${utils.formatearFecha(u.fecha_ingreso)}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="window.editarTrabajador(${u.id})">Editar</button>
                  <button class="btn btn-outline btn-sm" style="margin-left:6px;" onclick="window.desactivarTrabajador(${u.id})">${u.activo ? 'Desactivar' : 'Activar'}</button>
                  <button class="btn btn-outline btn-sm" style="margin-left:6px;" onclick="window.verHistoricoTrabajador(${u.id})">Días</button>

                  ${esAdmin ? `<button class="btn btn-small btn-danger" style="margin-left:6px;" onclick="window.eliminarUsuarioAdmin(${u.id})">Eliminar</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const p = res.paginacion || {};
      const totalPaginas = p.totalPaginas || 1;
      const total = p.total || data.length;
      pag.innerHTML = `
        <div class="pagination-info">${total} resultado(s) - Página ${page} de ${totalPaginas}</div>
        <div style="margin-top:8px;">
          <button class="btn btn-outline" ${page<=1?'disabled':''} onclick="page=${page-1}; window.__cargarTrabajadores();">← Anterior</button>
          <button class="btn btn-outline" style="margin-left:8px;" ${page>=totalPaginas?'disabled':''} onclick="page=${page+1}; window.__cargarTrabajadores();">Siguiente →</button>
        </div>
      `;
    } catch (err) {
      lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
      pag.innerHTML = '';
    }
  };

  window.__cargarTrabajadores();
}

// export a window para router
window.vistaPanelSolicitudes = vistaPanelSolicitudes;
window.vistaTrabajadores = vistaTrabajadores;


// Función para generar autorización de días imprimible para el trabajador
window.generarPDFAutorizacion = async function(idSolicitud){
  try {
    const u = utils || window.utils;
    const data = await API.detalleSolicitud(idSolicitud);

    // Identidad de la empresa para el encabezado del reporte
    // (se configura en "Config. días" -> Empresa; se persiste en el servidor)
    let empresa = { nombre: 'Empresa XYZ', subtitulo: 'Recursos Humanos', logo: null };
    try {
      const cfg = await API.empresaObtener();
      if (cfg) {
        empresa.nombre = cfg.nombre || empresa.nombre;
        empresa.subtitulo = cfg.subtitulo || empresa.subtitulo;
        empresa.logo = cfg.logo || null;
      }
    } catch (e) { /* si falla la consulta se usa el valor por defecto */ }

    const trabajador = {
      nombre: data.trabajador_nombre || 'N/A',
      numero: data.trabajador_numero || 'N/A',
      nss: data.trabajador_nss || 'N/A',
      curp: data.trabajador_curp || 'N/A',
      fecha_ingreso: data.trabajador_fecha_ingreso ? u.formatearFecha(data.trabajador_fecha_ingreso) : 'N/A',
      departamento: data.trabajador_departamento || 'N/A',
    };

    const etiquetasEstatus = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', cancelada: 'Cancelada' };
    const solicitud = {
      folio: data.id || 'N/A',
      inicio: u.formatearFecha(data.fecha_inicio),
      fin: u.formatearFecha(data.fecha_fin),
      dias: data.dias_solicitados,
      conGoce: data.dias_con_goce || 0,
      sinGoce: data.dias_sin_goce || 0,
      corte: u.formatearFecha(data.corte_correspondiente),
      estatus: u.escape(etiquetasEstatus[data.estatus] || data.estatus || 'N/A'),
      creada: data.fecha_creacion ? u.formatearFechaHora(data.fecha_creacion) : 'N/A',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Autorización de Vacaciones</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; color: #222; margin: 0; padding: 40px; }
          .encabezado { text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 14px; margin-bottom: 24px; }
          .encabezado img.logo { max-height: 80px; max-width: 260px; object-fit: contain; margin-bottom: 8px; }
          .encabezado h1 { margin: 0; font-size: 28px; color: #1a5276; letter-spacing: 2px; }
          .encabezado p { margin: 4px 0 0; color: #777; font-size: 13px; }
          h2 { text-align: center; font-size: 20px; letter-spacing: 1px; color: #1a5276; margin: 0 0 22px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; }
          td, th { border: 1px solid #bbb; padding: 9px 12px; font-size: 14px; text-align: left; }
          th { background: #eaf2f8; color: #1a5276; width: 42%; }
          .firmas { display: flex; justify-content: space-between; margin-top: 48px; }
          .firma { text-align: center; width: 45%; }
          .firma .linea { border-top: 1px solid #222; margin-bottom: 6px; }
          .nota { text-align: center; font-size: 11px; color: #888; margin-top: 30px; }
          @media print { body { padding: 12mm; } }
        </style>
      </head>
      <body>
        <div class="encabezado">
          ${empresa.logo ? `<img class="logo" src="${empresa.logo}" alt="Logotipo">` : ''}
          <h1>${u.escape(empresa.nombre)}</h1>
          <p>${u.escape(empresa.subtitulo)}</p>
        </div>
        <h2>AUTORIZACIÓN DE VACACIONES</h2>
        <p>Por medio de la presente, se autoriza el periodo vacacional del trabajador citado a continuación:</p>
        <table>
          <tr><th>Nombre</th><td>${u.escape(trabajador.nombre)}</td></tr>
          <tr><th>Número de trabajador</th><td>${u.escape(trabajador.numero)}</td></tr>
          <tr><th>NSS</th><td>${u.escape(trabajador.nss)}</td></tr>
          <tr><th>CURP</th><td>${u.escape(trabajador.curp)}</td></tr>
          <tr><th>Fecha de ingreso</th><td>${trabajador.fecha_ingreso}</td></tr>
          <tr><th>Departamento</th><td>${u.escape(trabajador.departamento)}</td></tr>
        </table>
        <p>Datos de la solicitud:</p>
        <table>
          <tr><th>Folio / N° de solicitud</th><td>${solicitud.folio}</td></tr>
          <tr><th>Fecha de inicio</th><td>${solicitud.inicio}</td></tr>
          <tr><th>Fecha de fin</th><td>${solicitud.fin}</td></tr>
          <tr><th>Días solicitados</th><td>${solicitud.dias} (${solicitud.conGoce} con goce / ${solicitud.sinGoce} sin goce)</td></tr>
          <tr><th>Corte correspondiente</th><td>${solicitud.corte}</td></tr>
          <tr><th>Estatus</th><td>${solicitud.estatus}</td></tr>
          <tr><th>Fecha de solicitud</th><td>${solicitud.creada}</td></tr>
        </table>
        <div class="firmas">
          <div class="firma">
            <div class="linea">&nbsp;</div>
            <strong>Autorizó</strong><br><small>Recursos Humanos</small>
          </div>
          <div class="firma">
            <div class="linea">&nbsp;</div>
            <strong>El trabajador</strong><br><small>Firma de conformidad</small>
          </div>
        </div>
        <p class="nota">Este documento se genera automáticamente por el sistema de solicitudes de vacaciones.</p>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=800,height=600');
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
      ventana.print();
    } else {
      alert('No se pudo abrir la ventana de impresión. Asegúrate de que no esté bloqueada por un popup blocker.');
    }
  } catch (err) {
    (utils.swal ? utils.swal(err.message||String(err),'error') : alert(err.message||String(err)));
  }
};
