const logger = require('../utils/logger');
module.exports.validateEnvs = () => {
    try {
        let invalidEnvs = [];
        const envsToVerify = ['DBSCHEMA','DBNAME','DBUSER','DBPASSWORD','DBHOST','DBPORT','ENV_CONFIG','PORT','ACCESS_TOKEN_SECRET_KEY','ACCESS_TOKEN_EXPIRY_TIME','REFRESH_TOKEN_SECRET_KEY','REFRESH_TOKEN_EXPIRY_TIME','SALTROUNDS','ALLOWED_SOURCES','PASSWORD_LENGTH','AUTH_API_LIMIT_COUNT','HEALTH_API_LIMIT_COUNT','GENERAL_API_LIMIT_COUNT'];

        for (const env of envsToVerify) {
            if (!process.env[env]) invalidEnvs.push(env);
        }
        if (invalidEnvs.length) {
            throw new Error('Environmental Variables not found: ' + invalidEnvs);
        }
    } catch (error) {
        logger.error(error, 'Envs missing error');
        process.exit(1);
    }
}