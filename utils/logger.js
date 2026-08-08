const pino = require('pino');
const { getTraceId } = require('./traceContext');

const logger = pino({
  level: 'info',
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
