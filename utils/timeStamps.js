const moment = require('moment');

module.exports.getCurrentTimestamp = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

module.exports.addFromCurrentTime = (value, units) => {
    return moment().add(value, units).format('YYYY-MM-DD HH:mm:ss');
}