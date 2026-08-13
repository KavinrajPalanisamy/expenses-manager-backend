const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { sendRsp } = require('../middlewares/response');

const menuModel = require('../models/menu');

module.exports.getMenuItems = async (req, res, next) => {
    try {
        const menuData = await menuModel.getSubMenuGroupWithMenu();
        return sendRsp(res, 200, '', '', menuData);
    } catch (error) {
        next(error);
    }
}