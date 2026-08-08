const express = require('express');
const router = express.Router();

const { apiLimiter } = require('../middlewares/rateLimiters');
const authMw = require('../middlewares/auth');
const usersController = require('../controllers/users');

router.post('/register-user', apiLimiter, usersController.createUser);
router.get('/check-user-exists', apiLimiter, usersController.checkUserNameExists);

module.exports = router;