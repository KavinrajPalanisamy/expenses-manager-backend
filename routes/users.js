const express = require('express');
const router = express.Router();

const authMw = require('../middleware/auth');
const usersController = require('../controllers/users');

router.post('/register-user', usersController.createUser);
router.get('/check-user-exists', usersController.checkUserNameExists);

module.exports = router;