const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const empresaController = require('../controllers/empresaController');

// Cualquier usuario autenticado puede leer la identidad de la empresa (reportes/impresiones)
router.get('/', auth, (req, res, next) => {
  return empresaController.obtener(req, res, next);
});

// Solo administrador puede modificar nombre/subtítulo/logotipo
router.put('/', auth, checkRole('administrador'), (req, res, next) => {
  return empresaController.guardar(req, res, next);
});

module.exports = router;