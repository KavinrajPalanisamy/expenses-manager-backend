const bcrypt = require('bcryptjs');


const { dbConnection } = require('../config/dbConfig');
const { ERROR_CODES } = require('../utils/constants');


module.exports.authorise = async (req, res) => {
    let [userDetails] = await dbConnection.query(`select username, email, first_name, last_name, display_name, is_locked, current_password from user_credentials uc where is_active = true and (username = :username or email = :email)`, {
        replacements: { username: req.body.userName, email: req.body.email },
        type: dbConnection.QueryTypes.SELECT
    });

    if (!userDetails) {
        await bcrypt.compare('', '$2y$10$dU8iqmv7DjLY/SPymMQgf.lTHxtWyQHqYkIdwADT6vngqEQ8xrpLy');
        return res.status(400).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
    }

    let isMatching = await bcrypt.compare(req.body.password, userDetails.current_password);
    if (!isMatching) {
        return res.status(400).json({ code: ERROR_CODES.INVALID_CREDENTIAL, message: 'User Name or Password is incorrect' });
    }

    return res.status(200).json({ message: userDetails });
}
