const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

const authController = require('../controllers/auth');

router.post('/verify-user', authController.authorise);

module.exports = router;