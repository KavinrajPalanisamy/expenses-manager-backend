const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

const { dbConnection } = require('../config/dbConfig');

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

router.get('/db-health', async (req, res) => {
  try {
    await dbConnection.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'reachable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(error, 'Unable to reach database');
    res.status(503).json({
      status: 'error',
      database: 'unreachable',
      error: 'Unable to reach database',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;