// Dashboard del trabajador
async function vistaDashboard() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Dashboard');

  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="loading"><div class="spinner"></div>Cargando...</div>`;

  try {
    const data = await API.dashboard();
    const v = data.vacaciones;
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">Días disponibles</div>
          <div class="stat-value">${v.dias_disponibles}</div>
          <div class="stat-sub">De ${v.dias_asignados} asignados</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Días usados</div>
          <div class="stat-value">${v.dias_usados}</div>
          <div class="stat-sub">Corte vigente</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Días pendientes</div>
          <div class="stat-value">${v.dias_pendientes}</div>
          <div class="stat-sub">En revisión</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Antigüedad</div>
          <div class="stat-value">${data.usuario.antiguedad}</div>
          <div class="stat-sub">año(s)</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Mis datos</h3>
        </div>
        <div class="info-grid">
          <div class="info-item"><label>Nombre</label><span>${utils.escape(data.usuario.nombre)}</span></div>
          <div class="info-item"><label>Correo</label><span>${utils.escape(data.usuario.email)}</span></div>
          <div class="info-item"><label>Número de trabajador</label><span>${utils.escape(data.usuario.numero_trabajador) || 'Sin asignar'}</span></div>
          <div class="info-item"><label>Fecha de ingreso</label><span>${utils.formatearFecha(data.usuario.fecha_ingreso)}</span></div>
          <div class="info-item"><label>Antigüedad</label><span>${utils.calcularAntiguedadTexto(data.usuario.fecha_ingreso)}</span></div>
          <div class="info-item"><label>Días según antigüedad</label><span>${v.dias_asignados} días</span></div>
          <div class="info-item"><label>Corte anual vigente</label><span>${utils.formatearFecha(v.corte_vigente)}</span></div>
          <div class="info-item"><label>Próximo corte</label><span>${utils.formatearFecha(v.corte_siguiente)}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Solicitudes recientes</h3>
          <button class="btn btn-primary btn-sm" onclick="router.navigate('/nueva-solicitud')">+ Nueva solicitud</button>
        </div>
        <div id="solicitudes-recientes"></div>
      </div>
    `;

    // Cargar solicitudes recientes
    try {
      const res = await API.misSolicitudes('?limit=5');
      const cont = document.getElementById('solicitudes-recientes');
      if (res.data.length === 0) {
        cont.innerHTML = '<div class="empty-state">No tienes solicitudes aún. ¡Crea tu primera solicitud!</div>';
      } else {
        cont.innerHTML = `
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Fecha inicio</th><th>Fecha fin</th><th>Días</th><th>Corte</th><th>Estatus</th>
              </tr></thead>
              <tbody>
                ${res.data.map(s => `
                  <tr style="cursor:pointer" onclick="verSolicitud(${s.id})">
                    <td>${utils.formatearFecha(s.fecha_inicio)}</td>
                    <td>${utils.formatearFecha(s.fecha_fin)}</td>
                    <td>${s.dias_solicitados}</td>
                    <td>${utils.formatearFecha(s.corte_correspondiente)}</td>
                    <td>${utils.badgeEstatus(s.estatus)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:12px;text-align:right;">
            <button class="btn btn-outline btn-sm" onclick="router.navigate('/mis-solicitudes')">Ver todo el historial →</button>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('solicitudes-recientes').innerHTML = `<div class="alert alert-error">No se pudieron cargar las solicitudes</div>`;
    }
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">Error al cargar el dashboard: ${utils.escape(err.message)}</div>`;
  }
}
