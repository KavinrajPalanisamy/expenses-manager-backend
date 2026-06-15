const { randomUUID } = require('node:crypto');
const logger = require('../utils/logger');
const { runWithTraceContext } = require('../utils/traceContext');

function requestTraceMiddleware(req, res, next) {
  const traceId = randomUUID();
  const startedAt = Date.now();

  runWithTraceContext({ traceId }, () => {
    req.traceId = traceId;
    res.locals.traceId = traceId;
    res.setHeader('trace-id', traceId);
    let completionLogged = false;

    const logCompletion = (message) => {
      if (completionLogged) {
        return;
      }

      completionLogged = true;
      logger.info(
        {
          ipAddress: req.ip,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt
        },
        message
      );
    };

    logger.info(
      {
        ipAddress: req.ip,
        method: req.method,
        url: req.originalUrl,
        reqAt: startedAt
      },
      'Request received'
    );

    res.on('finish', () => {
      logCompletion('Response sent');
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        logCompletion('Response closed before completion');
      }
    });

    next();
  });
}

module.exports = requestTraceMiddleware;
