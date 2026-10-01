// Vista ADMIN única: Backup/Restore + Config correo
async function vistaConfiguracionAdmin() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  if (!usuario || usuario.rol !== 'administrador') {
    renderAccesoDenegado(app);
    return;
  }

  renderLayout(app, usuario, 'Configuración ADMIN');
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Backup / Restore (SQLite)</h3></div>
      <div class="card-body">
        <div class="actions-row">
          <button class="btn btn-primary" onclick="window.adminCrearBackup()">Crear backup</button>
          <button class="btn btn-outline" onclick="window.adminDescargarBackup()">Descargar último</button>
        </div>
        <div class="actions-row" style="margin-top:10px;">
          <button class="btn btn-danger" onclick="window.adminRestoreClean()">Restore limpiar pruebas (clean)</button>
        </div>
        <div class="divider"></div>
        <div class="form-group">
          <label>Restore desde archivo (subir .db)</label>
          <input type="file" id="admin-restore-file" accept=".db" class="form-control" />
          <button class="btn btn-outline" style="margin-top:8px;" onclick="window.adminRestoreByUploadedFile()">Restaurar</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-header"><h3>Configurar correo (notificaciones)</h3></div>
      <div class="card-body">
        <form id="admin-email-form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
          <div style="flex-basis:100%;height:1px;"></div>
          <div class="form-group" style="min-width:320px;flex:1;">
            <label>Probar correo (destino)</label>
            <input id="email-test-to" class="form-control" type="email" placeholder="correo@ejemplo.com" required />
          </div>
          <button class="btn btn-outline" type="button" onclick="window.adminEnviarCorreoPrueba()">Enviar prueba</button>
          <div style="flex-basis:100%;height:1px;"></div>
          <div class="form-group"><label>SMTP host</label><input id="smtp_host" class="form-control" type="text"></div>
          <div class="form-group"><label>SMTP port</label><input id="smtp_port" class="form-control" type="number"></div>
          <div class="form-group"><label>SMTP user</label><input id="smtp_user" class="form-control" type="text"></div>
          <div class="form-group"><label>SMTP password</label><input id="smtp_password" class="form-control" type="password"></div>
          <div class="form-group"><label>Empresa nombre</label><input id="company_name" class="form-control" type="text"></div>
          <div class="form-group" style="min-width:320px;flex:1;"><label>Destinatarios RRHH (emails, coma)</label><textarea id="rrhh_recipients" class="form-control" rows="2"></textarea></div>
          <button class="btn btn-primary" type="submit">Guardar correo</button>
        </form>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-header"><h3>Empresa (reportes / autorizaciones)</h3></div>
      <div class="card-body">
        <form id="admin-empresa-form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
          <div style="flex-basis:100%;height:1px;"></div>
          <div class="form-group" style="flex:1;min-width:280px;">
            <label>Nombre de la empresa</label>
            <input id="empresa_nombre" class="form-control" type="text" placeholder="Ej. Empresa XYZ S.A. de C.V.">
          </div>
          <div class="form-group" style="flex:1;min-width:280px;">
            <label>Subtítulo (departamento que firma)</label>
            <input id="empresa_subtitulo" class="form-control" type="text" placeholder="Recursos Humanos">
          </div>
          <div style="flex-basis:100%;height:1px;"></div>
          <div class="form-group" style="flex-basis:100%;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input id="requiere_doble_autorizacion" type="checkbox">
              Requerir doble autorización de RH para aprobar solicitudes
            </label>
            <small style="color:#666;">Si está activo, una solicitud solo queda APROBADA cuando DOS usuarios distintos de RH/Admin la autorizan. Si se desactiva, las solicitudes vuelven a aprobarse con una sola autorización.</small>
          </div>
          <div style="flex-basis:100%;height:1px;"></div>
          <div class="form-group" style="min-width:320px;flex:1;">
            <label>Logotipo (PNG/JPG, máx. 5MB)</label>
            <input id="empresa_logo_file" class="form-control" type="file" accept="image/*">
            <div style="margin-top:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <img id="empresa_logo_preview" alt="Vista previa del logotipo"
                   style="max-height:64px;max-width:220px;object-fit:contain;display:none;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">
              <button class="btn btn-outline" type="button" onclick="window.quitarLogoEmpresa()">Quitar logotipo</button>
            </div>
          </div>
          <button class="btn btn-primary" type="submit">Guardar empresa</button>
        </form>
      </div>
    </div>
  `;

  // Si estamos sin token, muchas llamadas a /api/admin fallan.
  // Esto evita que el módulo quede en blanco.
  if (!API.token) {
    utils.swal('Sesión expirada, inicia sesión de nuevo', 'error');
    router.navigate('/login');
    return;
  }

  await cargarAdminEmailConfig();
  await cargarEmpresaConfig();

  const empresaForm = document.getElementById('admin-empresa-form');
  empresaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('empresa_logo_file');
    const archivo = fileInput.files && fileInput.files[0];

    try {
      const datos = {
        nombre: document.getElementById('empresa_nombre').value,
        subtitulo: document.getElementById('empresa_subtitulo').value,
        requiere_doble_autorizacion: document.getElementById('requiere_doble_autorizacion').checked
      };
      if (archivo) {
        if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen');
        if (archivo.size > 5 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máx. 5MB)');
        datos.logo = await leerArchivoComoDataURL(archivo);
        window._logoEmpresaRemovido = false;
      } else if (window._logoEmpresaRemovido) {
        datos.logo = null; // quitar el logotipo guardado
        window._logoEmpresaRemovido = false;
      }
      await API.empresaGuardar(datos);
      utils.swal('Empresa guardada. Aparecerá en los reportes.', 'success');
      fileInput.value = '';
      await cargarEmpresaConfig();
    } catch (err) {
      utils.swal(err.message || 'Error guardando empresa', 'error');
    }
  });

  const form = document.getElementById('admin-email-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rr = (document.getElementById('rrhh_recipients').value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const datos = {
      smtp_host: document.getElementById('smtp_host').value,
      smtp_port: parseInt(document.getElementById('smtp_port').value || '0', 10) || null,
      smtp_user: document.getElementById('smtp_user').value,
      smtp_password: document.getElementById('smtp_password').value,
      company_name: document.getElementById('company_name').value,
      rrhh_recipients: rr
    };

    try {
      await API.adminSetEmailConfig(datos);
      utils.swal('Config de correo guardada', 'success');
    } catch (err) {
      utils.swal(err.message || 'Error guardando correo', 'error');
    }
  });
}

function renderAccesoDenegado(app) {
  renderLayout(app, { nombre: 'Acceso denegado', rol: 'trabajador', secciones: [] }, 'Acceso denegado');
  document.getElementById('page-content').innerHTML = '<div class="alert alert-error">Solo administradores.</div>';
}

function leerArchivoComoDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

async function cargarEmpresaConfig() {
  try {
    const cfg = await API.empresaObtener();
    document.getElementById('empresa_nombre').value = cfg.nombre || '';
    document.getElementById('empresa_subtitulo').value = cfg.subtitulo || '';
    document.getElementById('requiere_doble_autorizacion').checked = !!cfg.requiere_doble_autorizacion;
    const prev = document.getElementById('empresa_logo_preview');
    if (cfg.logo) {
      prev.src = cfg.logo;
      prev.style.display = 'inline-block';
    } else {
      prev.removeAttribute('src');
      prev.style.display = 'none';
    }
  } catch (e) {
    // sin config previa
  }
}

window.quitarLogoEmpresa = function () {
  const fileInput = document.getElementById('empresa_logo_file');
  if (fileInput) fileInput.value = '';
  const prev = document.getElementById('empresa_logo_preview');
  if (prev) {
    prev.removeAttribute('src');
    prev.style.display = 'none';
  }
  window._logoEmpresaRemovido = true;
};

async function cargarAdminEmailConfig() {
  try {
    const cfg = await API.adminGetEmailConfig();
    document.getElementById('smtp_host').value = cfg.smtp_host || '';
    document.getElementById('smtp_port').value = cfg.smtp_port || '';
    document.getElementById('smtp_user').value = cfg.smtp_user || '';
    document.getElementById('smtp_password').value = cfg.smtp_password || '';
    document.getElementById('company_name').value = cfg.company_name || '';

    let rr = [];
    try {
      rr = cfg.rrhh_recipients ? JSON.parse(cfg.rrhh_recipients) : [];
    } catch (e) {
      rr = [];
    }
    document.getElementById('rrhh_recipients').value = (rr || []).join(', ');
  } catch (e) {
    // sin config previa
  }
}

window.adminCrearBackup = async function () {
  try {
    const r = await API.adminCrearBackup();
    utils.swal(r.mensaje || 'Backup creado', 'success');
  } catch (err) {
    utils.swal(err.message || 'Error creando backup', 'error');
  }
};

window.adminDescargarBackup = async function () {
  try {
    // Descarga con Authorization (evita 401 de window.location)
    const token = localStorage.getItem('token');
    const res = await fetch(`${API.baseUrl}/admin/backup`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      let txt = '';
      try { txt = await res.text(); } catch (e) {}
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const disp = res.headers.get('content-disposition') || '';
    const match = disp.match(/filename="?([^\"]+)"?/i);
    const filename = match ? match[1] : 'backup.db';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    utils.swal(err.message || 'Error descargando backup', 'error');
  }
};

window.adminRestoreClean = async function () {
  if (!confirm('¿Seguro que deseas restore clean-tests?')) return;
  try {
    await API.adminRestoreClean();
    utils.swal('Restore clean completado', 'success');
  } catch (err) {
    utils.swal(err.message || 'Error haciendo restore clean', 'error');
  }
};

window.adminRestoreByFilename = async function () {
  const filename = (document.getElementById('admin-restore-filename').value || '').trim();
  if (!filename) return utils.swal('Escribe filename', 'error');
  if (!confirm(`¿Restaurar desde ${filename}?`)) return;
  try {
    await API.adminRestore(filename);
    utils.swal('Restore completado', 'success');
  } catch (err) {
    utils.swal(err.message || 'Error restaurando', 'error');
  }
};

window.adminEnviarCorreoPrueba = async function(){
  try{
    const to = document.getElementById('email-test-to').value;
    if(!to) return utils.swal('Selecciona un destino para la prueba','error');
    const r = await API.adminEnviarCorreoPrueba(to);
    utils.swal('Correo de prueba enviado','success');
  }catch(err){
    utils.swal(err.message || 'Error enviando prueba','error');
  }
};

window.vistaConfiguracionAdmin = vistaConfiguracionAdmin;
window.vistaConfiguracion = vistaConfiguracionAdmin;
