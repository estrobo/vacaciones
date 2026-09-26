// Módulo de comunicación con la API
const API = {
  token: localStorage.getItem('token'),
  baseUrl: '/api',

  syncTokenFromStorage() {
    // Asegura que si el token se actualiza después del cargar la página, se siga usando
    this.token = localStorage.getItem('token');
  },

  async request(endpoint, method = 'GET', body = null) {
    this.syncTokenFromStorage();
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en la petición');
      }
      return data;
    } catch (err) {
      // Si el token expiró o es inválido, redirigir al login
      if (err.message.includes('Token') || err.message.includes('autentic')) {
        this.logout();
      }
      throw err;
    }
  },

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  logout() {
    this.setToken(null);
    localStorage.removeItem('usuario');
    router.navigate('/login');
  },

  // Auth
  login: (email, password) => API.request('/auth/login', 'POST', { email, password }),
  registrar: (datos) => API.request('/auth/registrar', 'POST', datos),
  perfil: () => API.request('/auth/perfil'),

  // ADMIN/RRHH - Reset contraseña por email
  resetPassword: (datos) => API.request('/auth/reset-password', 'POST', datos),

  // Usuarios
  dashboard: () => API.request('/usuarios/dashboard'),
  listarUsuarios: (params = '') => API.request(`/usuarios${params}`),
  obtenerUsuario: (id) => API.request(`/usuarios/${id}`),
  actualizarUsuario: (id, datos) => API.request(`/usuarios/${id}`, 'PUT', datos),
  desactivarUsuario: (id) => API.request(`/usuarios/${id}`, 'DELETE'),
  eliminarUsuario: (id) => API.request(`/usuarios/${id}/permanente`, 'DELETE'),

  // Solicitudes
  crearSolicitud: (datos) => API.request('/solicitudes', 'POST', datos),
  misSolicitudes: (params = '') => API.request(`/solicitudes/mias${params}`),
  listarSolicitudes: (params = '') => API.request(`/solicitudes${params}`),
  detalleSolicitud: (id) => API.request(`/solicitudes/${id}`),
  revisarSolicitud: (id, datos) => API.request(`/solicitudes/${id}/revisar`, 'PUT', datos),
  cancelarSolicitud: (id) => API.request(`/solicitudes/${id}/cancelar`, 'PUT'),
  eliminarSolicitud: (id) => API.request(`/solicitudes/${id}`, 'DELETE'),

  // Configuración de días
  listarConfig: () => API.request('/configuracion'),
  guardarConfig: (datos) => API.request('/configuracion', 'POST', datos),
  eliminarConfig: (id) => API.request(`/configuracion/${id}`, 'DELETE'),

  // ADMIN (backup/restore + correo)
  adminBackup: () => API.request('/admin/backup'),
  adminCrearBackup: () => API.request('/admin/backup', 'POST', {}),
  adminRestore: (filename) => API.request('/admin/restore', 'POST', { filename }),
  adminRestoreClean: () => API.request('/admin/restore/clean-tests', 'POST', {}),

  // Email config ADMIN
  // Endpoints: /api/admin/email-config
  adminGetEmailConfig: () => API.request('/admin/email-config', 'GET'),
  adminSetEmailConfig: (datos) => API.request('/admin/email-config', 'POST', datos),
  adminEnviarCorreoPrueba: (to) => API.request('/admin/email-test', 'POST', { to }),

  // Identidad de empresa para reportes / autorizaciones
  // Endpoints: /api/empresa
  empresaObtener: () => API.request('/empresa', 'GET'),
  empresaGuardar: (datos) => API.request('/empresa', 'PUT', datos),

  // ADMIN - Backups
  // (restauración y respaldos ya existen arriba)

  // Vacaciones
  historicoTrabajador: (id) => API.request(`/vacaciones/historico/${id}`),
  recalcularVacaciones: (id) => API.request(`/vacaciones/recalcular/${id}`, 'POST'),

  // Cierres generales
  crearCierreGeneral: (datos) => API.request('/cierres', 'POST', datos),

  // Usuarios con días disponibles para ajustes
  listarUsuariosDias: () => API.request('/usuarios/con-dias', 'GET'),
};

// Utilidades
const utils = {
  formatearFecha(f) {
    if (!f) return 'N/A';
    // Fechas DATEONLY (YYYY-MM-DD): formatear sin descontar la zona horaria
    if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) {
      const [y, m, d] = f.split('-').map(Number);
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const d = new Date(f);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatearFechaHora(f) {
    if (!f) return 'N/A';
    // Si solo trae la parte de fecha (YYYY-MM-DD), no desplazar por zona horaria
    if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) {
      return this.formatearFecha(f);
    }
    const d = new Date(f);
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  calcularAntiguedadTexto(fechaIngreso) {
    if (!fechaIngreso) return 'N/A';
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    let anos = hoy.getFullYear() - ingreso.getFullYear();
    let meses = hoy.getMonth() - ingreso.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    return `${anos} año(s)${meses > 0 ? ' y ' + meses + ' mes(es)' : ''}`;
  },
  badgeEstatus(estatus) {
    return `<span class="badge badge-${estatus}">${estatus}</span>`;
  },
  escape(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]));
  },
  hoy() {
    return new Date().toISOString().split('T')[0];
  },
  swal(mensaje, tipo = 'info') {
    const div = document.createElement('div');
    div.className = `alert alert-${tipo}`;
    div.textContent = mensaje;
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.zIndex = '9999';
    div.style.minWidth = '280px';
    div.style.maxWidth = '400px';
    div.style.animation = 'slideIn 0.3s ease';
    document.body.appendChild(div);
    setTimeout(() => { div.remove(); }, 4000);
  }
};
