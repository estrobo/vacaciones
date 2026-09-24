const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { auth, checkRole } = require('../middleware/auth');

// Trabajador crea una solicitud
router.post('/', auth, solicitudController.crear);
// Trabajador ve su historial
router.get('/mias', auth, solicitudController.misSolicitudes);
// Trabajador cancela una solicitud pendiente propia
router.put('/:id/cancelar', auth, solicitudController.cancelar);
// Detalle de una solicitud
router.get('/:id', auth, solicitudController.detalle);
// RH/Admin ven todas las solicitudes
router.get('/', auth, checkRole('RRHH', 'administrador'), solicitudController.listarTodas);
// RH/Admin aprueban/rechazan
router.put('/:id/revisar', auth, checkRole('RRHH', 'administrador'), solicitudController.revisar);
// Admin elimina una solicitud (para corregir solicitudes hechas por error o accidentalmente)
router.delete('/:id', auth, checkRole('administrador'), solicitudController.eliminar);

module.exports = router;
