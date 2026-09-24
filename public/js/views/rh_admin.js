// RH/Admin (completo) para gestionar solicitudes y trabajadores

async function vistaPanelSolicitudes() {
  const app = document.getElementById('app');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  renderLayout(app, usuario, 'Panel de solicitudes');

  const content = document.getElementById('page-content');
  let page = 1;
  const limit = 10;

  content.innerHTML = `
    <div class=\