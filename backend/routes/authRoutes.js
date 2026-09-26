const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/auth');

// Ruta para servir la vista de registro
router.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Registro y autenticación
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', (req,res)=>authController.perfil(req,res));

router.post('/reset-password', authController.resetPassword);
module.exports = router;
