const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { auth, checkRole } = require('../middleware/auth');

// Cualquier autenticado puede ver la configuración
router.get('/', auth, configuracionController.listar);
// Solo admin puede crear/actualizar/eliminar
router.post('/', auth, checkRole('administrador'), configuracionController.crearOActualizar);
router.put('/', auth, checkRole('administrador'), configuracionController.crearOActualizar);
router.delete('/:id', auth, checkRole('administrador'), configuracionController.eliminar);

module.exports = router;
