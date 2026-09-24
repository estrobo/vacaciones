// Vistas de autenticación
function vistaLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo">🏝️</div>
        <h2>Sistema de Vacaciones</h2>
        <p>Inicia sesión para gestionar tus días de descanso</p>
        <div id="login-error"></div>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" class="form-control" placeholder="tu@empresa.com" required autofocus>
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="form-control" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Iniciar sesión</button>
        </form>
        <div class="auth-link">¿No tienes cuenta? <a href="/registro">Regístrate aquí</a></div>
        <div style="margin-top:20px;padding:12px;background:var(--gray-50);border-radius:8px;font-size:12px;color:var(--gray-500);">
          <strong>Cuenta de prueba (admin):</strong><br>admin@empresa.com / admin123
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Iniciando...';
    try {
      const res = await API.login(email, password);
      API.setToken(res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      utils.swal('Bienvenido ' + res.usuario.nombre, 'success');
      router.navigate('/dashboard');
    } catch (err) {
      document.getElementById('login-error').innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  });
}

function vistaRegistro() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo">🏝️</div>
        <h2>Crear cuenta</h2>
        <p>Regístrate para solicitar tus días de vacaciones</p>
        <div id="registro-error"></div>
        <form id="registro-form">
          <div class="form-group">
            <label for="nombre">Nombre completo</label>
            <input type="text" id="nombre" class="form-control" required autofocus>
          </div>
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="fecha_ingreso">Fecha de ingreso a la empresa</label>
            <input type="date" id="fecha_ingreso" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="form-control" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-block">Registrar</button>
        </form>
        <div class="auth-link">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></div>
      </div>
    </div>
  `;

  document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      fecha_ingreso: document.getElementById('fecha_ingreso').value,
      password: document.getElementById('password').value,
    };
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Registrando...';
    try {
      await API.registrar(datos);
      utils.swal('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
      router.navigate('/login');
    } catch (err) {
      document.getElementById('registro-error').innerHTML = `<div class="alert alert-error">${utils.escape(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Registrar';
    }
  });
}
