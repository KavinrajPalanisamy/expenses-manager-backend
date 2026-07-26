const express = require('express');
const router = express.Router();

const authMw = require('../middleware/auth');
const authController = require('../controllers/auth');

router.post('/verify-user', authController.authorise);
router.post('/log-out', authMw.verifyRefreshToken, authController.logOut);
router.post('/refresh-token', authMw.verifyRefreshToken, authController.refreshToken);

module.exports = router;