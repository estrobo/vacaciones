// Router simple para SPA
const router = {
  routes: {},
  currentPath: '/',

  add(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    history.pushState({}, '', path);
    this.render(path);
  },

  async render(path) {
    this.currentPath = path;
    const app = document.getElementById('app');
    // Limpiar
    app.innerHTML = '';
    // Rutas públicas
    if (path === '/login' || path === '/registro') {
      if (!API.token) {
        return this.routes[path]();
      } else {
        return this.navigate('/dashboard');
      }
    }
    // El resto requiere auth
    if (!API.token) {
      return this.routes['/login']();
    }
    // Verificar si la ruta existe
    const handler = this.routes[path] || this.routes['/dashboard'];
    try {
      await handler();
    } catch (err) {
      console.error('Error al renderizar:', err);
    }
    // Actualizar nav activa
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === path);
    });
  },

  init() {
    window.addEventListener('popstate', () => this.render(window.location.pathname));
    this.render(window.location.pathname);
  }
};
