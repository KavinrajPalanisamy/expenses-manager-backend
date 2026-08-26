const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { sendRsp } = require('../middlewares/response');

const { ERROR_CODES, PARAMS } = require('../utils/constants');
const time = require('../utils/timeStamps');

const accountsModel = require('../models/accounts');

module.exports.getProviders = async (req, res, next) => {
    try {
        let providers = await accountsModel.getProviders();
        let accountTypes = await accountsModel.getAccountTypes();
        return sendRsp(res, 200, '', '', [{ providers, accountTypes }]);
    } catch (error) {
        next(error);
    }
}

module.exports.getAccounts = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
        }
        let accountData = await accountsModel.getAllAccountsByUserId({ userId: req.user.userId });
        return sendRsp(res, 200, '', '', accountData);
    } catch (error) {
        next(error);
    }
}

module.exports.editAccount = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
        }

        if (!req.params.type) {
            throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
        }

        if (!req.body.account_id) {
            throw new AppError(400, 'Invalid Account ID', ERROR_CODES.INVALID_DATA);
        }

        const isAccountExist = await accountsModel.checkAccountIdAgainstUserId({ userId: req.user.userId, accountId: req.body.account_id });
        if (!isAccountExist) {
            throw new AppError(400, 'Account Not found', ERROR_CODES.ACCOUNT_NOT_FOUND);
        }

        let updateData = {};
        let whereCondition = {
            where: { id : req.body.account_id}
        }

        if (req.params.type == PARAMS.ADJUST_BALANCE) {
            if (!req.body?.account_balance) {
                throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
            }
            if (!req.body?.reason) {
                throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
            }
            updateData['opening_balance_minor'] = req.body.account_balance;
        } 
        else if (req.params.type = PARAMS.EDIT_ACCOUNT) {
            updateData['account_name'] = req.body.account_name;
            updateData['account_holder_name'] = req.body.account_holder_name;
            updateData['account_number'] = req.body.account_number;
            updateData['opening_balance_minor'] = req.body.account_balance;
            updateData['account_provider_id'] = req.body.account_provider_id;
            updateData['account_type_id'] = req.body.account_type_id;
            updateData['is_active'] = req.body.is_active;
            updateData['is_default'] = req.body.is_default;
        }
        else {
            throw new AppError(400, 'Invalid Request', ERROR_CODES.INVALID_DATA);
        }
        
        await accountsModel.updateAccountDetails(updateData, whereCondition);
        let accountData = await accountsModel.getAllAccountsByUserId({ userId: req.user.userId });
        return sendRsp(res, 200, '', 'Successfully Updated', accountData);
    } catch (error) {
        next(error);
    }
}