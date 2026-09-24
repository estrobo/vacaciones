const express = require('express');
const router = express.Router();
const vacacionesController = require('../controllers/vacacionesController');
const { auth, checkRole } = require('../middleware/auth');

// RH/Admin ven histórico de un trabajador
router.get('/historico/:id', auth, checkRole('RRHH', 'administrador'), vacacionesController.historicoTrabajador);
// RH/Admin pueden recalcular
router.post('/recalcular/:id', auth, checkRole('RRHH', 'administrador'), async (req, res, next) => {
    try {
        await vacacionesController.recalcular(req, res, next);
    } catch (e) {
        next(e);
    }
});

// Ajustar días disponibles manualmente (RRHH/Admin)
router.put('/ajustar-dias', auth, checkRole('RRHH', 'administrador'), vacacionesController.ajustarDiasDisponibles);

// Historial de ajustes de días (solo lectura)
router.get('/historial', auth, checkRole('RRHH', 'administrador'), vacacionesController.historialAjustes);

module.exports = router;
