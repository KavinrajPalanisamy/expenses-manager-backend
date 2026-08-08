const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { dbConnection } = require('../config/dbConfig');
const sessionModel = require('../models/session_details');
const userModel = require('../models/user_credentials');

const { ERROR_CODES } = require('../utils/constants');
const timestamps = require('../utils/timeStamps');
const logger = require('../utils/logger');


module.exports.authorise = async (req, res) => {
    try {
        if (!(req.body?.email || req.body?.userName) || !req.body?.password) {
            logger.info('Invalid Request Body');
            return res.status(400).json({ message: 'Email/username and password are required' });
        }

        let userDetails = await userModel.getUserData(req.body);
        if (!userDetails) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User not found');
            await bcrypt.compare('', '$2y$10$dU8iqmv7DjLY/SPymMQgf.lTHxtWyQHqYkIdwADT6vngqEQ8xrpLy');
            return res.status(401).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
        }

        if (userDetails.is_locked) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User is locked');
            return res.status(401).json({ code: ERROR_CODES.USER_LOCKED, message: 'User Locked! Kindly contact support team.' });
        }

        let isMatching = await bcrypt.compare(req.body.password, userDetails.current_password);
        if (!isMatching) {
            logger.info('Invalid Credentials');
            return res.status(401).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
        }

        let accessTokenData = { userId: userDetails.user_id, userName: userDetails.username, email: userDetails.email, firstName: userDetails.first_name, lastName: userDetails.last_name, displayName: userDetails.display_name };
        const accessToken = jwt.sign(accessTokenData, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME });
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
        return res.status(200).json({ data: JSON.stringify(accessTokenData), accessToken: accessToken });
    } catch (error) {
        logger.error(error, 'Internal Server Error');
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.logOut = async (req, res) => {
    try {
        if (!req.user.userId) {
            return res.status(400).json({ message: 'Valid User Id required' });
        }
        await sessionModel.terminateSessions({
            userId: req.user.userId,
            sessionId: req.user.sessionId,
            revokeReason: req.body?.revokeReason || 'User logged out'
        });
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged Successfully' });
    } catch (error) {
        logger.error(error, 'Internal Server Error');
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.refreshToken = async (req, res) => {
    try {
        if (!(req.user?.email || req.user?.userName)) {
            logger.info(req.body, 'Invalid Token Data');
            return res.status(400).json({ message: 'Email or username was missing from the token' });
        }

        if (!req.user?.sessionId) {
            logger.info(req.body, 'Invalid Session');
            return res.status(400).json({ message: 'Invalid Session' });
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
            return res.status(401).json({ code: ERROR_CODES.INVALID_SESSION, message: 'Session Not Found' });
        }

        let isValidRefreshToken = verifyRefreshToken(req.cookies.refreshToken);
        if (isValidRefreshToken.statusCode) {
            return res.status(isValidRefreshToken.statusCode).json({ message: isValidRefreshToken.message, code: isValidRefreshToken.code });
        }

        let userDetails = await userModel.getUserData(reqBody);
        if (!userDetails) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User not found');
            return res.status(401).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
        }

        if (userDetails.is_locked) {
            logger.info({ username: reqBody.userName, email: reqBody.email }, 'User is locked');
            return res.status(401).json({ code: ERROR_CODES.USER_LOCKED, message: 'User Locked! Kindly contact support team.' });
        }

        let accessTokenData = { sessionId: req.user.sessionId, userId: userDetails.user_id, userName: userDetails.username, email: userDetails.email, firstName: userDetails.first_name, lastName: userDetails.last_name, displayName: userDetails.display_name };
        const accessToken = jwt.sign(accessTokenData, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME });
        logger.info('New Access Token Generated - Sending Response');
        await sessionModel.updateSessions(reqBody);
        return res.status(200).json({ data: JSON.stringify(accessTokenData), accessToken: accessToken });

    } catch (error) {
        logger.error(error, 'Internal Server Error');
        res.status(500).json({ message: 'Internal Server Error' });
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