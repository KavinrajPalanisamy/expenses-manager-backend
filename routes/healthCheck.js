const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

const { healthCheckLimiter } = require('../middlewares/rateLimiters');
const { dbConnection } = require('../config/dbConfig');
const { ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');
const { sendRsp } = require('../middlewares/response');

router.get("/server", healthCheckLimiter, (req, res) => {
  return sendRsp(res, 200, '', 'Server online', {
    status: "ok",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

router.get('/db', healthCheckLimiter, async (req, res, next) => {
  try {
    logger.info('Checking DB Health');
    await dbConnection.query('SELECT 1', {
      type: dbConnection.QueryTypes.SELECT
    });

    return sendRsp(res, 200, '', 'Database online', {
      status: 'ok',
      database: 'reachable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(new AppError(503, 'Unable to reach the database', ERROR_CODES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;