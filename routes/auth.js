const express = require('express');
const router = express.Router();

const { authLimiter } = require('../middlewares/rateLimiters');
const authMw = require('../middlewares/auth');
const authController = require('../controllers/auth');

router.post('/verify-user', authLimiter, authController.authorise);
router.post('/log-out', authLimiter, authMw.verifyRefreshToken, authController.logOut);
router.post('/refresh-token', authLimiter, authMw.verifyRefreshToken, authController.refreshToken);

module.exports = router;