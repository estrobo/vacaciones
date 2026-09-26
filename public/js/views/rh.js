// Vista: Panel de solicitudes (RH/Admin)
async function vistaPanelSolicitudes() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Panel de solicitudes');

  const content = document.getElementById('page-content');
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Solicitudes de vacaciones</h3></div>
      <div class="filters-bar">
        <div class="form-group"><label>Buscar</label><input type="text" id="f-busqueda" class="form-control" placeholder="Nombre o # trabajador" oninput="page=1;cargarTodasSolicitudes()"></div>
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
      if (!res.data || res.data.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>No se encontraron solicitudes.</p></div>';
      } else {
        lista.innerHTML = renderTablaSolicitudes(res.data, true);
      }
      renderPaginacion('todas-solicitudes-pag', res.paginacion, (p) => {
        page = p;
        cargarTodasSolicitudes();
      });
    } catch (err) {
      lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
    }
  };

  cargarTodasSolicitudes();
}

// --- Funciones
function renderTablaSolicitudes(data, esRH) {
  return `...<rest of HTML>`;
}document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Panel de solicitudes');
  const content = document.getElementById('page-content');
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Solicitudes de vacaciones</h3></div>
      <div class="filters-bar">
        <div class="form-group"><label>Buscar</label><input type="text" id="f-busqueda" class="form-control" placeholder="Nombre o # trabajador" oninput="page=1;cargarTodasSolicitudes()"></div>
        <div class="form-group"><label>Estatus</label>
          <select id="f-estatus" class="form-control" onchange="page=1;cargarTodasSolicitudes()">
            <option value="">Todos</option><option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option><option value="rechazada">Rechazadas</option>
            <option value="cancelada">Canceladas</option>
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

  window.cargarTodasSolicitudes = async function() {
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
      if (res.data.length === 0) { lista.innerHTML = '<div class="empty-state"><p>No se encontraron solicitudes.</p></div>'; }
      else { lista.innerHTML = renderTablaSolicitudes(res.data, true); }
      renderPaginacion('todas-solicitudes-pag', res.paginacion, (p) => { page = p; cargarTodasSolicitudes(); });
    } catch (err) { lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`; }
  };
  cargarTodasSolicitudes();

// Vista: Gestión de trabajadores (RH/Admin)
async function vistaTrabajadores() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Trabajadores');
  const content = document.getElementById('page-content');
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Lista de trabajadores</h3></div>
      <div class="filters-bar">
        <div class="form-group"><label>Buscar</label><input type="text" id="f-busqueda" class="form-control" placeholder="Nombre, email o #" oninput="page=1;cargarTrabajadores()"></div>
        <div class="form-group"><label>Rol</label>
          <select id="f-rol" class="form-control" onchange="page=1;cargarTrabajadores()">
            <option value="">Todos</option><option value="trabajador">Trabajador</option>
            <option value="RRHH">Recursos Humanos</option><option value="administrador">Administrador</option>
          </select>
        </div>
        <div class="form-group"><button class="btn btn-outline" onclick="page=1;cargarTrabajadores()">Buscar</button></div>
      </div>
      <div id="trabajadores-lista"></div>
      <div id="trabajadores-pag"></div>
    </div>`;

  window.cargarTrabajadores = async function() {
    const lista = document.getElementById('trabajadores-lista');
    lista.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const params = new URLSearchParams({ page, limit });
    const busqueda = document.getElementById('f-busqueda').value;
    const rol = document.getElementById('f-rol').value;
    if (busqueda) params.append('busqueda', busqueda);
    if (rol) params.append('rol', rol);
    try {
      const res = await API.listarUsuarios('?' + params.toString());
      if (res.data.length === 0) { lista.innerHTML = '<div class="empty-state"><p>No se encontraron trabajadores.</p></div>'; }
      else { lista.innerHTML = renderTablaTrabajadores(res.data); }
      renderPaginacion('trabajadores-pag', res.paginacion, (p) => { page = p; cargarTrabajadores(); });
    } catch (err) { lista.innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`; }
  };
  cargarTrabajadores();
}

function renderTablaTrabajadores(data) {
  return `
    <div class="table-wrapper"><table>
      <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th># Trab.</th><th>Fecha ing.</th><th>Activo</th><th>Acciones</th></tr></thead>

      <tbody>
        ${data.map(u => `
          <tr>
            <td>${utils.escape(u.nombre || '')}</td>
            <td>${utils.escape(u.email || '')}</td>
            <td><span class="badge badge-rol">${utils.escape(u.rol || '')}</span></td>
            <td>${utils.escape(u.numero_trabajador || '')}</td>
            <td>${utils.formatearFecha(u.fecha_ingreso)}</td>
            <td>${u.activo ? 'Sí' : 'No'}</td>
            <td>
              <button class="btn btn-small" onclick="editarTrabajador(${u.id})">Editar</button>
              <button class="btn btn-small" onclick="restablecerPasswordTrabajador('${utils.escape(u.email)}')">Reset contraseña</button>
              <button class="btn btn-small btn-danger" onclick="desactivarTrabajador(${u.id})">${u.activo ? 'Desactivar' : 'Activar'}</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;

}
189 |             </td>
190 |           </tr>
191 |         `).join('')}
192 |       </tbody>
193 |     </table>
194 |   </div>`;
195 | 
196 | }

// RH/Admin - Restablecer contraseña (por email)
async function resetPasswordPorEmail(email) {
  const { value: newPassword } = await Swal.fire({
    title: 'Nueva contraseña',
    input: 'password',
    inputLabel: 'Contraseña',
    inputAttributes: { minlength: 6, autocapitalize: 'off' },
    showCancelButton: true,
    confirmButtonText: 'Restablecer',
    cancelButtonText: 'Cancelar'
  });

  if (!newPassword) return;

  try {
    const res = await API.resetPassword({ email, newPassword });
    // API devuelve message, pero algunos endpoints envuelven success; lo manejamos tolerante
    const msg = res.message || 'Contraseña restablecida con éxito';
    utils.swal(msg, 'success');
  } catch (err) {
    utils.swal(err.message || 'Error al resetear la contraseña', 'error');
  }
}


// Funciones RH/Admin
async function editarTrabajador(id) {
  try {
    const u = await API.obtenerUsuario(id);
    const secciones = u.secciones || [];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3>Editar trabajador</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
        <div id="edit-error"></div>
        <form id="edit-form">
          <div class="form-row">
            <div class="form-group"><label>Nombre</label><input type="text" id="e-nombre" class="form-control" value="${utils.escape(u.nombre)}" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="e-email" class="form-control" value="${utils.escape(u.email)}" readonly></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Rol</label>
              <select id="e-rol" class="form-control">
                <option value="trabajador" ${u.rol==='trabajador'?'selected':''}>Trabajador</option>
                <option value="RRHH" ${u.rol==='RRHH'?'selected':''}>Recursos Humanos</option>
                <option value="administrador" ${u.rol==='administrador'?'selected':''}>Administrador</option>
              </select>
            </div>
            <div class="form-group"><label>Estado</label>
              <select id="e-activo" class="form-control">
                <option value="true" ${u.activo?'selected':''}>Activo</option>
                <option value="false" ${!u.activo?'selected':''}>Inactivo</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Número de trabajador</label><input type="text" id="e-numero" class="form-control" value="${utils.escape(u.numero_trabajador)||''}"></div>
            <div class="form-group"><label>Fecha de ingreso</label><input type="date" id="e-ingreso" class="form-control" value="${u.fecha_ingreso}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>NSS</label><input type="text" id="e-nss" class="form-control" value="${utils.escape(u.nss)||''}"></div>
            <div class="form-group"><label>CURP</label><input type="text" id="e-curp" class="form-control" value="${utils.escape(u.curp)||''}"></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
        </form>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = {
        nombre: document.getElementById('e-nombre').value,

// Ver histórico de días de un trabajador
async function verHistoricoTrabajador(id) {
  try {
    const res = await API.historicoTrabajador(id);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3>Historial de vacaciones - ${utils.escape(res.trabajador.nombre)}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button></div>
        <div class="info-grid" style="margin-bottom:16px;">
          <div class="info-item"><label>Número de trabajador</label><span>${utils.escape(res.trabajador.numero_trabajador) || 'N/A'}</span></div>
          <div class="info-item"><label>Fecha de ingreso</label><span>${utils.formatearFecha(res.trabajador.fecha_ingreso)}</span></div>
        </div>
        <div class="table-wrapper"><table>
          <thead><tr><th>Corte anual</th><th>Antigüedad</th><th>Asignados</th><th>Usados</th><th>Pendientes</th><th>Disponibles</th><th>Vigente</th></tr></thead>
          <tbody>
            ${res.controles.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--gray-500);">Sin registros</td></tr>' :
              res.controles.map(c => `<tr><td>${utils.formatearFecha(c.corte_anual)}</td><td>${c.antiguedad_corte} año(s)</td><td>${c.dias_asignados}</td><td>${c.dias_usados}</td><td>${c.dias_pendientes}</td><td><strong>${c.dias_disponibles}</strong></td><td>${c.activo ? '✅' : ''}</td></tr>`).join('')}
          </tbody>
        </table></div>
        <div class="modal-footer"><button class="btn btn-primary" onclick="recalcularYRecargar(${id})">Recalcular días</button><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button></div>
      </div>`;
    document.body.appendChild(overlay);
  } catch (err) { utils.swal(err.message, 'error'); }
}

window.recalcularYRecargar = async function(id) {
  try {
    await API.recalcularVacaciones(id);
    utils.swal('Días recalculados', 'success');
    document.querySelector('.modal-overlay').remove();
    verHistoricoTrabajador(id);
  } catch (err) { utils.swal(err.message, 'error'); }
};
window.editarTrabajador = editarTrabajador;
window.verHistoricoTrabajador = verHistoricoTrabajador;

        rol: document.getElementById('e-rol').value,
        numero_trabajador: document.getElementById('e-numero').value,
        nss: document.getElementById('e-nss').value,
        curp: document.getElementById('e-curp').value,
        fecha_ingreso: document.getElementById('e-ingreso').value,
        activo: document.getElementById('e-activo').value === 'true'
      };
      try {
        await API.actualizarUsuario(id, datos);
        utils.swal('Trabajador actualizado', 'success');
        overlay.remove();
        cargarTrabajadores();
      } catch (err) { document.getElementById('edit-error').innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`; }
    });
  } catch (err) { utils.swal(err.message, 'error'); }
}

      <tbody>
        ${data.map(u => `
          <tr>
            <td>${utils.escape(u.nombre)}</td><td>${utils.escape(u.email)}</td>
            <td><span class="badge badge-rol">${u.rol}</span></td>
            <td>${utils.escape(u.numero_trabajador) || '-'}</td>
            <td>${utils.formatearFecha(u.fecha_ingreso)}</td>
            <td>${u.activo ? '✅' : '❌'}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="editarTrabajador(${u.id})">Editar</button>
              <button class="btn btn-outline btn-sm" onclick="verHistoricoTrabajador(${u.id})">Días</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>
  `;
}

}
