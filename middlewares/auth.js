const jwt = require('jsonwebtoken');
const { ERROR_CODES } = require('../utils/constants');

module.exports.verifyToken = (req, res, next) => {
    const accessToken = req.headers['accesstoken'];
    if (!accessToken) {
        return res.status(401).json({ message: 'No Token Provided', code: ERROR_CODES.NO_TOKEN });
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            if (err.name == 'TokenExpiredError') {
                return res.status(401).json({ code: ERROR_CODES.ACCESS_TOKEN_EXPIRED, message: 'Access token expired' });
            }
            return res.status(401).json({ code: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    })
}

module.exports.verifyRefreshToken = (req, res, next) => {
    let refreshToken = req?.cookies?.refreshToken || '';
    if (!refreshToken) {
        return res.status(401).json({ message: 'No Token Provided', code: ERROR_CODES.NO_TOKEN });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, decoded) => {
        if (err) {
            if (err.name == 'TokenExpiredError') {
                return res.status(401).json({ code: ERROR_CODES.REFRESH_TOKEN_EXPIRED, message: 'Refresh token expired' });
            }
            return res.status(401).json({ code: ERROR_CODES.INVALID_TOKEN, message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    })
}

module.exports.catchHandler = (functionName) => {
    try {
        
    } catch (error) {
        logger.error(error, 'Internal Server Error');
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
