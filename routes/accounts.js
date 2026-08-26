const express = require('express');
const router = express.Router();

const { apiLimiter } = require('../middlewares/rateLimiters');
const authMw = require('../middlewares/auth');

const accountsController = require('../controllers/accounts');

router.get('/get-providers', apiLimiter, authMw.verifyToken, accountsController.getProviders);
router.get('/get-accounts', apiLimiter, authMw.verifyToken, accountsController.getAccounts);
router.post('/edit-account/:type', apiLimiter, authMw.verifyToken, accountsController.editAccount);

module.exports = router;