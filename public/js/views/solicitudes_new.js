// Solicitudes - versión funcional (MIS SOLICITUDES)
(function(){
  console.log('vistaMisSolicitudes cargó');

  function badgeEstatus(estatus){
    
  }

  // ============ MODAL DE DECISIÓN RH/ADMIN (profesional) ============
  // Muestra el detalle completo: días, desglose con/sin goce, badge rojo SIN GOCE
  // y disponibilidad del trabajador en el corte correspondiente.
  window.abrirDecisionSolicitud = async function(id, esAutorizar){
    let s;
    try { s = await API.detalleSolicitud(id); }
    catch(e){ utils.swal && utils.swal(e.message, 'error'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h3>${esAutorizar ? 'Autorizar' : 'Rechazar'} solicitud #${s.id}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div id="dec-error"></div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item"><label>Trabajador</label><span>${utils.escape(s.trabajador_nombre || '')}</span></div>
            <div class="info-item"><label># trabajador</label><span>${utils.escape(s.trabajador_numero || 'N/A')}</span></div>
            <div class="info-item"><label>Inicio</label><span>${utils.formatearFecha(s.fecha_inicio)}</span></div>
            <div class="info-item"><label>Fin</label><span>${utils.formatearFecha(s.fecha_fin)}</span></div>
            <div class="info-item"><label>Días solicitados</label><span><strong>${s.dias_solicitados}</strong></span></div>
            <div class="info-item"><label>Corte</label><span>${utils.formatearFecha(s.corte_correspondiente)}</span></div>
            <div class="info-item"><label>Días CON goce</label><span>${s.dias_con_goce || 0}</span></div>
            <div class="info-item"><label>Días SIN goce</label><span>${s.dias_sin_goce || 0} ${(s.dias_sin_goce || 0) > 0 ? '<span class="badge badge-danger">SIN GOCE</span>' : ''}</span></div>
          </div>
          ${s.comentarios_trabajador ? `<div class="form-group"><label>Comentarios del trabajador</label><div class="alert alert-info">${utils.escape(s.comentarios_trabajador)}</div></div>` : ''}
          <div id="disponibilidad-info" class="form-group"><label>Disponibilidad del trabajador</label><div class="loading"><div class="spinner"></div></div></div>
          <div class="form-group">
            <label for="dec-comentarios">Comentarios de RH ${esAutorizar ? '(opcional)' : '(obligatorio para rechazar)'}</label>
            <textarea id="dec-comentarios" class="form-control" rows="3" placeholder="Nota visible para el trabajador..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
          <button id="dec-btn-autorizar" class="btn ${esAutorizar ? 'btn-primary' : 'btn-danger'}">${esAutorizar ? '✔ Sí, autorizar' : '✖ Sí, rechazar'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Disponibilidad del trabajador (control del corte correspondiente)
    (async () => {
      try {
        const h = await API.historicoTrabajador(s.trabajador_id);
        const corteStr = String(s.corte_correspondiente || '').slice(0, 10);
        const ctl = (h.controles || []).find(c => String(c.corte_anual || '').slice(0, 10) === corteStr);
        const info = document.getElementById('disponibilidad-info');
        if (ctl) {
          info.innerHTML = `
            <table class="table" style="margin-top:6px;"><tbody>
              <tr><td>Asignados</td><td><strong>${ctl.dias_asignados}</strong></td></tr>
              <tr><td>Usados</td><td>${ctl.dias_usados}</td></tr>
              <tr><td>Pendientes</td><td>${ctl.dias_pendientes}</td></tr>
              <tr><td><strong>Disponibles</strong></td><td><strong>${ctl.dias_disponibles}</strong></td></tr>
            </tbody></table>`;
        } else {
          info.innerHTML = '<div class="alert alert-warning">Sin control activo para el corte de esta solicitud.</div>';
        }
      } catch(e) {
        const info = document.getElementById('disponibilidad-info');
        if (info) info.innerHTML = '<div class="alert alert-warning">No se pudo cargar la disponibilidad.</div>';
      }
    })();

    document.getElementById('dec-btn-autorizar').addEventListener('click', async ()=>{
      const comentario = document.getElementById('dec-comentarios').value.trim();
      if (!esAutorizar && !comentario) {
        document.getElementById('dec-error').innerHTML = '<div class="alert alert-error">Debes indicar el motivo del rechazo.</div>';
        return;
      }
      const btn = document.getElementById('dec-btn-autorizar');
      btn.disabled = true; btn.textContent = 'Procesando...';
      try {
        await API.revisarSolicitud(id, { estatus: esAutorizar ? 'aprobada' : 'rechazada', comentarios: comentario });
        utils.swal && utils.swal(`Solicitud ${esAutorizar ? 'APROBADA' : 'RECHAZADA'}`, 'success');
        overlay.remove();
        if (typeof window.cargarTodasSolicitudes === 'function') window.cargarTodasSolicitudes();
        if (typeof window.__cargarTodasSolicitudes === 'function') window.__cargarTodasSolicitudes();
        if (typeof window.__cargarMisSolicitudes === 'function') window.__cargarMisSolicitudes();
      } catch(e) {
        document.getElementById('dec-error').innerHTML = `<div class="alert alert-error">${utils.escape(e.message || String(e))}</div>`;
        btn.disabled = false; btn.textContent = esAutorizar ? '✔ Sí, autorizar' : '✖ Sí, rechazar';
      }
    });
  };

  function badgeEstatus(estatus){
    try { return utils.badgeEstatus(estatus); } catch(e){ return String(estatus||''); }
  }

  async function verSolicitud(id){
    const s = await API.detalleSolicitud(id);

    const overlay=document.createElement('div');
    overlay.className='modal-overlay';
    overlay.innerHTML=`
      <div class="modal">
        <div class="modal-header">
          <h3>Detalle de solicitud #${s.id}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="info-grid">
          <div class="info-item"><label>Inicio</label><span>${utils.formatearFecha(s.fecha_inicio)}</span></div>
          <div class="info-item"><label>Fin</label><span>${utils.formatearFecha(s.fecha_fin)}</span></div>
          <div class="info-item"><label>Días</label><span>${s.dias_solicitados}</span></div>
          <div class="info-item"><label>Días CON goce</label><span>${s.dias_con_goce || 0}</span></div>
          <div class="info-item"><label>Días SIN goce</label><span>${s.dias_sin_goce || 0} ${(s.dias_sin_goce || 0) > 0 ? '<span class="badge badge-danger">SIN GOCE</span>' : ''}</span></div>
          <div class="info-item"><label>Estatus</label><span>${badgeEstatus(s.estatus)}</span></div>
          ${s.corte_correspondiente ? `<div class="info-item"><label>Corte</label><span>${utils.formatearFecha(s.corte_correspondiente)}</span></div>` : ''}
          <div class="info-item" style="grid-column:1/3;">
            <label>Comentarios trabajador</label>
            <span>${s.comentarios_trabajador ? utils.escape(s.comentarios_trabajador) : 'N/A'}</span>
          </div>
          <div class="info-item" style="grid-column:1/3;">
            <label>Comentarios RH</label>
            <span>${s.comentarios_rh ? utils.escape(s.comentarios_rh) : 'N/A'}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  async function vistaNuevaSolicitud(){
    const app=document.getElementById('app');
    const usuario=JSON.parse(localStorage.getItem('usuario')||'{}');
    if(typeof renderLayout==='function') renderLayout(app,usuario,'Nueva solicitud');
    const content=document.getElementById('page-content')||app;

    content.innerHTML=`
      <div class="card" style="max-width:680px;">
        <div class="card-header"><h3>Formulario de solicitud de vacaciones</h3></div>
        <div id="form-error"></div>
        <form id="solicitud-form" class="card-body">
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

          <div class="form-row">
            <div class="form-group" style="flex:0 0 260px;">
              <label>Días solicitados</label>
              <div id="dias-info" class="info-pill">0</div>
            </div>
            <div class="form-group" style="flex:1;">
              <label>Comentarios (opcional)</label>
              <textarea id="comentarios" class="form-control" rows="3" placeholder="Motivo/nota adicional"></textarea>
            </div>
          </div>

          <div class="modal-footer" style="justify-content:flex-end;">
            <button type="submit" class="btn btn-primary">Enviar solicitud</button>
          </div>
        </form>
      </div>
    `;

    const fechaInicioEl = document.getElementById('fecha_inicio');
    const fechaFinEl = document.getElementById('fecha_fin');
    const diasInfoEl = document.getElementById('dias-info');
    const form = document.getElementById('solicitud-form');
    const errorEl = document.getElementById('form-error');

    // Interpreta "YYYY-MM-DD" como día calendario en UTC para que el cálculo
    // no dependa de la zona horaria ni del horario de verano (coincide con backend).
    function parseFechaISO(v){
      const [y, m, d] = v.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    }

    function calcularDias(){
      const fi = fechaInicioEl.value;
      const ff = fechaFinEl.value;
      if(!fi || !ff){ diasInfoEl.textContent = '0'; return; }
      const inicio = parseFechaISO(fi);
      const fin = parseFechaISO(ff);
      if(fin < inicio){ diasInfoEl.textContent = '0'; return; }
      const diff = Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
      diasInfoEl.textContent = String(diff);
      return diff;
    }

    fechaInicioEl.addEventListener('change', calcularDias);
    fechaFinEl.addEventListener('change', calcularDias);

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      errorEl.innerHTML = '';
      try{
        const datos = {
          fecha_inicio: fechaInicioEl.value,
          fecha_fin: fechaFinEl.value,
          comentarios: document.getElementById('comentarios').value || ''
        };
        await API.crearSolicitud(datos);
        utils.swal ? utils.swal('Solicitud enviada','success') : alert('Solicitud enviada');
        await vistaMisSolicitudes();
      } catch(err){
        // API.request lanza Error con data.error o mensaje genérico
        const msg = err && err.message ? err.message : String(err);
        errorEl.innerHTML = `<div class="alert alert-error">${utils.escape(msg)}</div>`;
        utils.swal && utils.swal(msg, 'error');
      }
    });
  }

async function vistaMisSolicitudes(){
    const app=document.getElementById('app');
    const usuario=JSON.parse(localStorage.getItem('usuario')||'{}');
    if(typeof renderLayout==='function') renderLayout(app,usuario,'Mis solicitudes');
    const content=document.getElementById('page-content')||app;

    content.innerHTML=`
      <div class="card"><div class="card-header"><h3>Mis solicitudes</h3></div>
        <div class="card-body">
          <div class="form-group" style="max-width:280px;"><label>Estatus</label>
            <select id="f-estatus" class="form-control">
              <option value="">Todos</option>
              <option value="pendiente">pendiente</option>
              <option value="aprobada">aprobada</option>
              <option value="rechazada">rechazada</option>
              <option value="cancelada">cancelada</option>
            </select>
          </div>
          <div id="mis-solicitudes-lista" style="margin-top:12px;"></div>
          <div id="mis-solicitudes-pag" style="margin-top:12px;"></div>
        </div></div>
    `;

    let page=1; const limit=10;
    const cargar=async()=>{
      const lista=document.getElementById('mis-solicitudes-lista');
      const pag=document.getElementById('mis-solicitudes-pag');
      const estatus=document.getElementById('f-estatus').value;
      const params=new URLSearchParams();
      params.append('page',String(page));
      params.append('limit',String(limit));
      if(estatus) params.append('estatus',estatus);

      try{
        const res=await API.misSolicitudes(`?${params.toString()}`);
        const data=res.data||[];
        if(data.length===0){ lista.innerHTML='<div class="alert alert-info">No hay solicitudes.</div>'; pag.innerHTML=''; return; }

        lista.innerHTML=`<table class="table"><thead><tr>
          <th>ID</th><th>Inicio</th><th>Fin</th><th>Días</th><th>Desglose</th><th>Estatus</th><th></th>
        </tr></thead><tbody>
        ${data.map(s=>`
          <tr>
            <td>${s.id}</td>
            <td>${utils.formatearFecha(s.fecha_inicio)}</td>
            <td>${utils.formatearFecha(s.fecha_fin)}</td>
            <td>${s.dias_solicitados}</td>
            <td>${(s.dias_sin_goce || 0) > 0
              ? `${s.dias_con_goce || 0} con / <strong class="text-danger">${s.dias_sin_goce} sin</strong> <span class="badge badge-danger">SIN GOCE</span>`
              : `${s.dias_con_goce || 0} con goce`}</td>
            <td>${badgeEstatus(s.estatus)}</td>
            <td>
              <button class="btn btn-outline" onclick="window.verSolicitud(${s.id})">Ver</button>
              ${s.estatus === 'pendiente'
                ? `<button class="btn btn-outline" style="margin-left:6px;" onclick="window.cancelarMiSolicitud(${s.id})">Cancelar</button>`
                : ''}
            </td>
          </tr>
        `).join('')}
        </tbody></table>`;

        const p=res.paginacion||{};
        const totalPaginas=p.totalPaginas||1;
        const total=p.total||data.length;
        pag.innerHTML=`<div class="pagination-info">${total} resultado(s) - Página ${page} de ${totalPaginas}</div>
          <div style="margin-top:8px;">
            <button class="btn btn-outline" ${page<=1?'disabled':''} onclick="page=${page-1}; window.__cargarMisSolicitudes()">← Anterior</button>
            <button class="btn btn-outline" style="margin-left:8px;" ${page>=totalPaginas?'disabled':''} onclick="page=${page+1}; window.__cargarMisSolicitudes()">Siguiente →</button>
          </div>`;
      }catch(err){ lista.innerHTML=`<div class="alert alert-error">${utils.escape(err.message)}</div>`; pag.innerHTML=''; }
    };

    window.__cargarMisSolicitudes=cargar;
    document.getElementById('f-estatus').addEventListener('change',()=>{ page=1; cargar(); });
    await cargar();
  }

  window.vistaMisSolicitudes=vistaMisSolicitudes;
  window.vistaNuevaSolicitud=vistaNuevaSolicitud;
  window.verSolicitud=verSolicitud;

  // Trabajador: cancelar una solicitud pendiente propia
  window.cancelarMiSolicitud=async (id)=>{
    if(!confirm('¿Cancelar esta solicitud? Solo se pueden cancelar solicitudes pendientes.')) return;
    try{
      await API.cancelarSolicitud(id);
      utils.swal ? utils.swal('Solicitud cancelada','success') : alert('Solicitud cancelada');
      if(typeof window.__cargarMisSolicitudes==='function') window.__cargarMisSolicitudes();
      else vistaMisSolicitudes();
    }catch(err){
      utils.swal ? utils.swal(err.message||String(err),'error') : alert(err.message||String(err));
    }
  };
})();
