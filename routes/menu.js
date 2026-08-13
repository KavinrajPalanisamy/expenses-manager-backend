const express = require('express');
const router = express.Router();

const { apiLimiter } = require('../middlewares/rateLimiters');
const authMw = require('../middlewares/auth');
const menuController = require('../controllers/menu');

router.get('/get-menu-items', apiLimiter, authMw.verifyToken, menuController.getMenuItems);

module.exports = router;