const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { dbConnection } = require('../config/dbConfig');
const sessionModel = require('../models/session_details');
const userModel = require('../models/user_credentials');

const { ERROR_CODES } = require('../utils/constants');
const AppError = require('../utils/AppError');
const timestamps = require('../utils/timeStamps');
const logger = require('../utils/logger');


module.exports.authorise = async (req, res, next) => {
    try {
        if (!(req.body?.email || req.body?.userName) || !req.body?.password) {
            logger.info('Invalid Request Body');
            throw new AppError(400, 'Email/username and password are required', ERROR_CODES.INVALID_CREDENTIAL);
        }

        let userDetails = await userModel.getUserData(req.body);
        if (!userDetails) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User not found');
            await bcrypt.compare('', '$2y$10$dU8iqmv7DjLY/SPymMQgf.lTHxtWyQHqYkIdwADT6vngqEQ8xrpLy');
            throw new AppError(401, 'User Name or Password is incorrect', ERROR_CODES.INVALID_CREDENTIAL);
        }

        if (userDetails.is_locked) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User is locked');
            throw new AppError(401, 'User Locked! Kindly contact support team.', ERROR_CODES.USER_LOCKED);
        }

        let isMatching = await bcrypt.compare(req.body.password, userDetails.current_password);
        if (!isMatching) {
            logger.info('Invalid Credentials');
            throw new AppError(401, 'User Name or Password is incorrect', ERROR_CODES.INVALID_CREDENTIAL);
        }

        let accessTokenData = { userId: userDetails.user_id, userName: userDetails.username, email: userDetails.email, firstName: userDetails.first_name, lastName: userDetails.last_name, displayName: userDetails.display_name };
        const accessToken = jwt.sign(accessTokenData, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: !req.body.keepSignedIn ? process.env.ACCESS_TOKEN_EXPIRY_TIME : process.env.REFRESH_TOKEN_EXPIRY_TIME});
        logger.info('Access Token Generated');

        const sessionData = {
            user_id: userDetails.user_id,
            is_active: true,
            expire_at: timestamps.addFromCurrentTime('24', 'hours'),
            last_used_at: timestamps.getCurrentTimestamp(),
            ip_address: req?.ip || req.socket.remoteAddress,
            os: req.headers["x-os"],
            user_agent: req.headers['x-browser'],
            device_type: req.headers["x-device-type"],
            refresh_token: '',
            created_at: timestamps.getCurrentTimestamp(),
            updated_at: timestamps.getCurrentTimestamp()
        }

        const dbResponse = await sessionModel.createRecord(sessionData);

        const refreshToken = jwt.sign({ userId: userDetails.user_id, sessionId: dbResponse.id, userName: userDetails.username, email: userDetails.email }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_TIME });
        await sessionModel.updateRefreshToken(dbResponse.id, refreshToken);

        accessTokenData.sessionId = dbResponse.id;
        logger.info('Session Generated');

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
        logger.info('Access Token Generated - Sending Response');
        return res.status(200).json({ data: JSON.stringify(accessTokenData), accessToken: accessToken, message: 'Logged in successfully.' });
    } catch (error) {
        next(error);
    }
}

module.exports.logOut = async (req, res, next) => {
    try {
        if (!req.user.userId) {
            throw new AppError(400, 'Invalid User Id', ERROR_CODES.INVALID_CREDENTIAL);
        }
        await sessionModel.terminateSessions({
            userId: req.user.userId,
            sessionId: req.user.sessionId,
            revokeReason: req.body?.revokeReason || 'User logged out'
        });
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
}

module.exports.refreshToken = async (req, res, next) => {
    try {
        if (!(req.user?.email || req.user?.userName)) {
            logger.info(req.body, 'Invalid Token Data');
            throw new AppError(400, 'Email or username was missing from the token', ERROR_CODES.INVALID_TOKEN);
        }

        if (!req.user?.sessionId) {
            logger.info(req.body, 'Invalid Session');
            throw new AppError(400, 'Invalid Session', ERROR_CODES.INVALID_SESSION);
        }

        let reqBody = {
            userName: req.user.userName,
            email: req.user.email,
            sessionId: req.user.sessionId,
            userId: req.user.userId
        };

        let sessionDetails = await sessionModel.getSessionInfoUsingSessionId(reqBody);
        if (!sessionDetails) {
            logger.info(req.body, 'Session Not Found in Database');
            throw new AppError(401, 'Session Not Found', ERROR_CODES.INVALID_SESSION);
        }
        
        let isValidRefreshToken = verifyRefreshToken(req.cookies.refreshToken);
        if (isValidRefreshToken.statusCode) {
            throw new AppError(isValidRefreshToken.statusCode, isValidRefreshToken.message, isValidRefreshToken.code);
        }
        
        let userDetails = await userModel.getUserData(reqBody);
        if (!userDetails) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User not found');
            throw new AppError(401, 'User Name or Password is incorrect', ERROR_CODES.INVALID_CREDENTIAL);
        }
        
        if (userDetails.is_locked) {
            logger.info({ username: reqBody.userName, email: reqBody.email }, 'User is locked');
            throw new AppError(401, 'User Locked! Kindly contact support.', ERROR_CODES.USER_LOCKED);
        }

        let accessTokenData = { sessionId: req.user.sessionId, userId: userDetails.user_id, userName: userDetails.username, email: userDetails.email, firstName: userDetails.first_name, lastName: userDetails.last_name, displayName: userDetails.display_name };
        const accessToken = jwt.sign(accessTokenData, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME });
        logger.info('New Access Token Generated - Sending Response');
        await sessionModel.updateSessions(reqBody);
        return res.status(200).json({ data: JSON.stringify(accessTokenData), accessToken: accessToken });

    } catch (error) {
        next(error);
    }
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return {
                message: "Refresh token expired",
                code: "REFRESH_TOKEN_EXPIRED",
                statusCode: 401
            };
        }

        if (err.name === "JsonWebTokenError") {
            return {
                message: "Invalid refresh token",
                code: "INVALID_REFRESH_TOKEN",
                statusCode: 401
            };
        }

        return {
            message: "Something went wrong",
            code: "SOMETHING_WENT_WRONG",
            statusCode: 500
        };
    }
}