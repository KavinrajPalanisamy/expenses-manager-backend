const rateLimit = require('express-rate-limit');
const { UNIT_METRICS, ERROR_CODES } = require('../utils/constants');

const apiLimiter = rateLimit({
    windowMs: UNIT_METRICS.TIME_IN_MS.MINUTE,
    limit: parseInt(process.env.GENERAL_API_LIMIT_COUNT || '60'),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Try again later.'
    }
})

const healthCheckLimiter = rateLimit({
    windowMs: UNIT_METRICS.TIME_IN_MS.MINUTE,
    limit: parseInt(process.env.HEALTH_API_LIMIT_COUNT || '5'),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Try again later.'
    }
})

const authLimiter = rateLimit({
    windowMs: UNIT_METRICS.TIME_IN_MS.MINUTE,
    limit: parseInt(process.env.AUTH_API_LIMIT_COUNT || '20'),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Try again later.'
    }
})


module.exports = {
    apiLimiter,
    healthCheckLimiter,
    authLimiter
}