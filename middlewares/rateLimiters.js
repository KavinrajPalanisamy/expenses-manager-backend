const { RateLimiterMemory } = require('rate-limiter-flexible');
const { UNIT_METRICS, ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');

const apiLimiterConfig = new RateLimiterMemory({
    points: parseInt(process.env.GENERAL_API_LIMIT_COUNT || '60'),
    duration: UNIT_METRICS.TIME_SECONDS.MINUTE,
    blockDuration: UNIT_METRICS.TIME_SECONDS.MINUTE * 5
})

const healthCheckLimiterConfig = new RateLimiterMemory({
    points: parseInt(process.env.HEALTH_API_LIMIT_COUNT || '5'),
    duration: UNIT_METRICS.TIME_SECONDS.MINUTE,
    blockDuration: UNIT_METRICS.TIME_SECONDS.MINUTE
})

const authLimiterConfig = new RateLimiterMemory({
    points: parseInt(process.env.AUTH_API_LIMIT_COUNT || '20'),
    duration: UNIT_METRICS.TIME_SECONDS.MINUTE,
    blockDuration: UNIT_METRICS.TIME_SECONDS.MINUTE * 30
})

const apiLimiter = async (req, res, next) => {
    try {
        await apiLimiterConfig.consume(req.ip);
        next();
    } catch (rateLimiterRes) {
        next(new AppError(429, 'Too many attempts. Try again later.', ERROR_CODES.TOO_MANY_REQUESTS));
    }
};

const healthCheckLimiter = async (req, res, next) => {
    try {
        await healthCheckLimiterConfig.consume(req.ip);
        next();
    } catch (rateLimiterRes) {
        next(new AppError(429, 'Too many attempts. Try again later.', ERROR_CODES.TOO_MANY_REQUESTS));
    }
};

const authLimiter = async (req, res, next) => {
    try {
        await authLimiterConfig.consume(req.ip);
        next();
    } catch (rateLimiterRes) {
        next(new AppError(429, 'Too many authentication attempts. Try again later.', ERROR_CODES.TOO_MANY_REQUESTS));
    }
};

module.exports = {
    apiLimiter,
    healthCheckLimiter,
    authLimiter
}