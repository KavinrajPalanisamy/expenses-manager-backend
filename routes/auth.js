const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');

router.post('/verify-user', authController.authorise);
router.post('/log-out', authController.logOut);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;