const pino = require('pino');
const { getTraceId } = require('./traceContext');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  mixin() {
    const traceId = getTraceId();
    return traceId ? { traceId } : {};
  }
});

module.exports = logger;
