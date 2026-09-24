const express = require('express');
const router = express.Router();
const cierreController = require('../controllers/cierreController');
const { auth, checkRole } = require('../middleware/auth');

// Solo RH/Admin pueden crear cierre general
router.post('/', auth, checkRole('RRHH', 'administrador'), cierreController.crearCierreGeneral);

module.exports = router;
