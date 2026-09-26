// Inicialización SPA
(function() {
  // Reglas: rutas
  router.add('/login', () => vistaLogin());
  router.add('/registro', () => vistaRegistro());
  router.add('/dashboard', () => vistaDashboard());
  router.add('/nueva-solicitud', () => { if (typeof vistaNuevaSolicitud !== 'function') { console.error('Error: vistaNuevaSolicitud no definida.'); return; } return vistaNuevaSolicitud(); });
  router.add('/mis-solicitudes', () => { if (typeof vistaMisSolicitudes !== 'function') { console.error('Error: vistaMisSolicitudes no definida.'); return; } return vistaMisSolicitudes(); });
  router.add('/solicitudes', () => vistaPanelSolicitudes());
router.add('/reset-password', () => vistaResetPassword());
  router.add('/usuarios', () => vistaTrabajadores());
  router.add('/configuracion', () => vistaConfiguracion());
  router.add('/cierre-general', () => vistaCierreGeneral());
router.add('/ajustar-dias', () => vistaAjustarDias());

  // Sidebar helpers
  window.toggleSidebar = toggleSidebar;
  window.cerrarSesion = cerrarSesion;

  router.init();
})();
