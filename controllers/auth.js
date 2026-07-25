const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { dbConnection } = require('../config/dbConfig');
const sessionModel = require('../models/session_details');

const { ERROR_CODES } = require('../utils/constants');
const timestamps = require('../utils/timeStamps');
const logger = require('../utils/logger');


module.exports.authorise = async (req, res) => {
    try {
        if (!(req.body?.email || req.body?.userName) || !req.body?.password) {
            logger.info('Invalid Request Body');
            return res.status(400).json({ message: 'Email/username and password are required' });
        }

        let userDetails = await sessionModel.getUserDetailsForAuth(req.body);
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
        const refreshToken = jwt.sign({ userId: userDetails.user_id }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_TIME });

        logger.info('Token Generated');

        const sessionData = {
            user_id: userDetails.user_id,
            is_active: true,
            expire_at: timestamps.addFromCurrentTime('24', 'hours'),
            last_used_at: timestamps.getCurrentTimestamp(),
            ip_address: '192.168.1.1',
            os: 'Dummy Os',
            user_agent: req.headers['user-agent'],
            device_type: 'Linux',
            refresh_token: refreshToken,
            created_at: timestamps.getCurrentTimestamp(),
            updated_at: timestamps.getCurrentTimestamp()
        }

        let dbResponse = await sessionModel.createRecord(sessionData);
        if (dbResponse) {
            accessTokenData.sessionId = dbResponse.id;
        }
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
        if (!req.body.userId) {
            return res.status(400).json({ message: 'Valid User Id required' });
        }
        await sessionModel.terminateSessions(req.body);
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged Successfully' });
    } catch (error) {
        logger.error(error, 'Internal Server Error');
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports.refreshToken = async (req, res) => {
    try {
        if (!(req.body?.email || req.body?.userName)) {
            logger.info(req.body, 'Invalid Request Body');
            return res.status(400).json({ message: 'Email or username are required' });
        }

        if (!req.body?.sessionId) {
            logger.info(req.body, 'Invalid Session');
            return res.status(400).json({ message: 'Invalid Session' });
        }

        if (!req?.cookies?.refreshToken) {
            logger.info(req.body, 'Cookie Not Found');
            return res.status(401).json({ message: 'Cookie Not Found' });
        }

        let sessionDetails = await sessionModel.getSessionInfoUsingSessionId(req.body);
        if (!sessionDetails) {
            logger.info(req.body, 'Session Not Found in Database');
            return res.status(401).json({ code: ERROR_CODES.INVALID_SESSION, message: 'Session Not Found' });
        }

        let isValidRefreshToken = verifyRefreshToken(req.cookies.refreshToken);
        if (isValidRefreshToken.statusCode) {
            return res.status(isValidRefreshToken.statusCode).json({ message: isValidRefreshToken.message });
        }

        let userDetails = await sessionModel.getUserDetailsForAuth(req.body);
        if (!userDetails) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User not found');
            return res.status(401).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
        }

        if (userDetails.is_locked) {
            logger.info({ username: req.body.userName, email: req.body.email }, 'User is locked');
            return res.status(401).json({ code: ERROR_CODES.USER_LOCKED, message: 'User Locked! Kindly contact support team.' });
        }

        let accessTokenData = { sessionId: req.body.sessionId, userId: userDetails.user_id, userName: userDetails.username, email: userDetails.email, firstName: userDetails.first_name, lastName: userDetails.last_name, displayName: userDetails.display_name };
        const accessToken = jwt.sign(accessTokenData, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME });
        logger.info('New Access Token Generated - Sending Response');
        await sessionModel.updateSessions(req.body);
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
                statusCode: 401
            };
        }

        if (err.name === "JsonWebTokenError") {
            return {
                message: "Invalid refresh token",
                statusCode: 401
            };
        }

        return {
            message: "Something went wrong",
            statusCode: 500
        };
    }
}