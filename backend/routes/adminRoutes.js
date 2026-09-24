const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// health: ayuda a verificar que el router admin está registrado en runtime
router.get('/health', (req, res) => {
  return res.json({ ok: true, message: 'adminRoutes OK' });
});

// Todas las rutas admin requieren rol administrador
router.get('/backup', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.backup(req,res,next);
});
router.post('/backup', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.createBackup(req,res,next);
});

router.post('/restore', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.restore(req,res,next);
});
router.post('/restore/clean-tests', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.restoreCleanTests(req,res,next);
});

// Configuración de correo (SMTP y destinatarios RRHH)
router.get('/email-config', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.getEmailConfig(req,res,next);
});
router.post('/email-config', auth, checkRole('administrador'), (req,res,next)=>{
  return adminController.setEmailConfig(req,res,next);
});

// Probar envío de correo
router.post('/email-test', auth, checkRole('administrador'), async (req, res, next) => {
  try {
    return await adminController.emailTest(req, res, next);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
