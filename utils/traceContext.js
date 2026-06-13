const { AsyncLocalStorage } = require('node:async_hooks');

const traceStore = new AsyncLocalStorage();

function runWithTraceContext(context, callback) {
  return traceStore.run(context, callback);
}

function getTraceContext() {
  return traceStore.getStore();
}

function getTraceId() {
  return getTraceContext()?.traceId;
}

module.exports = {
  getTraceContext,
  getTraceId,
  runWithTraceContext
};
