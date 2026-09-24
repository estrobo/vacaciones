// Layout principal con sidebar
function renderLayout(app, usuario, titulo) {
  const inicial = (usuario.nombre || '?').charAt(0).toUpperCase();
  const rol = usuario.rol || 'trabajador';
  const secciones = usuario.secciones || ['solicitudes_propias'];

  // Determinar items de navegación según rol
  let navItems = `
    <button class="nav-item" data-route="/dashboard" onclick="router.navigate('/dashboard')">🏠 Dashboard</button>
    <button class="nav-item" data-route="/nueva-solicitud" onclick="router.navigate('/nueva-solicitud')">➕ Solicitar vacaciones</button>
    <button class="nav-item" data-route="/mis-solicitudes" onclick="router.navigate('/mis-solicitudes')">📋 Mis solicitudes</button>
  `;

  // RH y Admin tienen acceso a más secciones
  if (rol === 'RRHH' || rol === 'administrador' || secciones.includes('panel_rh')) {
    navItems += `
      <button class="nav-item" data-route="/solicitudes" onclick="router.navigate('/solicitudes')">✅ Panel de solicitudes</button>
      <button class="nav-item" data-route="/usuarios" onclick="router.navigate('/usuarios')">👥 Trabajadores</button>
      <button class="nav-item" data-route="/cierre-general" onclick="router.navigate('/cierre-general')">📅 Cierre general</button>
    `;
  }
  if (rol === 'administrador' || secciones.includes('configuracion')) {
    navItems += `
      <button class="nav-item" data-route="/configuracion" onclick="router.navigate('/configuracion')">⚙️ Config. días</button>
    `;
  }

  // Nueva sección: Ajuste de días disponibles (solo RRHH y administrador)
  if (rol === 'RRHH' || rol === 'administrador') {
    navItems += `
      <button class="nav-item" data-route="/ajustar-dias" onclick="router.navigate('/ajustar-dias')">🔧 Ajuste de días</button>
    `;
  }

  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h1>🏝️ Vacaciones</h1>
          <p>Gestión de días de descanso</p>
        </div>
        <nav>${navItems}</nav>
        <div style="padding:16px 20px;margin-top:auto;">
          <button class="nav-item" onclick="cerrarSesion()" style="color:#fca5a5;">🚪 Cerrar sesión</button>
        </div>
      </aside>
      <main class="main-content">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="burger" onclick="toggleSidebar()"><span></span><span></span><span></span></button>
            <h2>${titulo}</h2>
          </div>
          <div class="user-menu">
            <div class="user-info">
              <p>${utils.escape(usuario.nombre || '')}</p>
              <span class="badge badge-rol">${rol}</span>
            </div>
            <div class="avatar">${inicial}</div>
          </div>
        </div>
        <div id="page-content"></div>
      </main>
    </div>
  `;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function cerrarSesion() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    API.logout();
  }
}
