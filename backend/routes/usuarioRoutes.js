const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const { auth, checkRole } = require('../middleware/auth');

// El trabajador puede ver su dashboard
router.get('/dashboard', auth, usuarioController.dashboardTrabajador);

// Nuevo: Usuarios con días disponibles (RRHH/Admin)
router.get(
  '/con-dias',
  auth,
  checkRole('RRHH', 'administrador'),
  (req, res, next) => {
    return usuarioController.listarConDiasDisponibles(req, res, next);
  }
);

// Obtener un usuario por id
router.get('/:id', auth, usuarioController.obtener);

// Listar usuarios (solo RH/admin)
router.get('/', auth, checkRole('RRHH', 'administrador'), usuarioController.listar);

// Actualizar usuario (solo admin)
router.put('/:id', auth, checkRole('administrador', 'RRHH'), usuarioController.actualizar);

// Desactivar usuario (solo admin)
router.delete('/:id', auth, checkRole('administrador'), usuarioController.desactivar);

// Eliminar definitivamente un usuario y todos sus datos (solo admin)
router.delete('/:id/permanente', auth, checkRole('administrador'), usuarioController.eliminarPermanente);

module.exports = router;
