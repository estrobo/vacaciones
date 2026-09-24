const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', auth, authController.perfil);

module.exports = router;
