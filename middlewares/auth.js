const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

module.exports.verifyToken = (req, res, next) => {
    const accessToken = req.headers['accesstoken'];
    if (!accessToken) {
        return next(new AppError(401, 'No Token Provided', ERROR_CODES.NO_TOKEN));
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            if (err.name == 'TokenExpiredError') {
                return next(new AppError(401, 'Access token expired', ERROR_CODES.ACCESS_TOKEN_EXPIRED));
            }
            return next(new AppError(401, 'Invalid Token', ERROR_CODES.INVALID_TOKEN));
        }
        req.user = decoded;
        next();
    })
}

module.exports.verifyRefreshToken = (req, res, next) => {
    let refreshToken = req?.cookies?.refreshToken || '';
    if (!refreshToken) {
        return next(new AppError(401, 'No Token Provided', ERROR_CODES.NO_TOKEN));
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            if (err.name == 'TokenExpiredError') {
                return next(new AppError(401, 'Refresh token expired', ERROR_CODES.REFRESH_TOKEN_EXPIRED));
            }
            return next(new AppError(401, 'Invalid Token', ERROR_CODES.INVALID_TOKEN));
        }

        req.user = decoded;
        next();
    })
}

