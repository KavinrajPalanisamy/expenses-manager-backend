const bcrypt = require('bcryptjs');
const moment = require('moment');

const { ERROR_CODES } = require('../utils/constants');
const timestamps = require('../utils/timeStamps');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const userModel = require('../models/user_credentials');
const authController = require('./auth');

module.exports.createUser = async (req, res, next) => {
    try {
        let errorLogs = [];
        if (!req.body?.firstName) {
            errorLogs.push({ key: 'firstName', message: 'Invalid First Name.', label: 'First Name' });
        }
        if (!req.body?.userName) {
            errorLogs.push({ key: 'userName', message: 'Invalid Last Name.', label: 'Username' });
        }
        if (!req.body?.dateOfBirth) {
            errorLogs.push({ key: 'dateOfBirth', message: 'Invalid Date of Birth.', label: 'Date of Birth' });
        }
        if (!req.body?.email) {
            errorLogs.push({ key: 'email', message: 'Invalid Email.', label: 'Email' });
        }
        if (!req.body?.password) {
            errorLogs.push({ key: 'password', message: 'Invalid Password.', label: 'Password' });
        }
        if (!req.body?.confirmPassword) {
            errorLogs.push({ key: 'confirmPassword', message: 'Kindly Confirm the Password.', label: 'Confirm Password' });
        }
        if (!req.body?.acceptTermsAndConditions) {
            errorLogs.push({ key: 'acceptTermsAndConditions', message: 'Kindly Accept the Terms and Conditions.', label: 'Terms and Conditions' });
        }
        if (req.body?.password?.length < parseInt(process.env?.PASSWORD_LENGTH || '8')) {
            errorLogs.push({ key: ['password', 'confirmPassword'], message: 'Password does not match.' });
        }
        if (req.body?.password !== req.body?.confirmPassword) {
            errorLogs.push({ key: ['password', 'confirmPassword'], message: 'Password does not match.' });
        }

        if (errorLogs.length) {
            let frameErrorMsg = errorLogs.map(msg => `${msg.label}: ${msg.message}\n`);
            // logger.info(errorLogs, frameErrorMsg);
            throw new AppError(400, frameErrorMsg, ERROR_CODES.INVALID_DATA);
            // return res.status(400).json({ message: frameErrorMsg, errors: errorLogs });
        }

        let data = {
            first_name: req.body.firstName,
            last_name: req.body?.lastName || '',
            display_name: req.body.displayName || '',
            username: req.body.userName,
            email: req.body.email,
            password_updated_at: timestamps.getCurrentTimestamp(),
            date_of_birth: moment(req.body.dateOfBirth).format('YYYY-MM-DD')
        }

        data['current_password'] = await bcrypt.hash(req.body.password, parseInt(process.env?.SALTROUNDS || '10'));
        logger.info('Creating a user.');

        let user = await userModel.createUser(data);
        logger.info(`User created. User Id: ${user?.user_id || null}`);

        await authController.authorise(req, res, next);
    } catch (error) {
        next(error);
    }
}

module.exports.checkUserNameExists = async (req, res, next) => {
    try {
        if (!req.query?.email && !req.query?.userName) {
            throw new AppError(400, 'Invalid Email or Username', ERROR_CODES.INVALID_DATA);
        }

        let userExists = await userModel.getUserData(req.query);
        if (userExists) {
            return res.status(200).json({ isUserExits: true, message: 'User already exists' });
        }
        return res.status(200).json({ isUserExits: false, message: 'User not found' });
    } catch (error) {
        next(error);
    }
}
