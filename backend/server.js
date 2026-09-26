const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/database');

require('./models/init');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const vacacionesRoutes = require('./routes/vacacionesRoutes');
const cierreRoutes = require('./routes/cierreRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/cierres', cierreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/empresa', empresaRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
sequelize.sync()
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error BD:', err));

module.exports = app;
// Redirigir todas las rutas no encontradas a la vista principal
app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});