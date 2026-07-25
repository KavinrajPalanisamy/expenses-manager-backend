const Sequelize = require('sequelize');
const logger = require('../utils/logger');
const schemaName = process.env.DBSCHEMA || 'expense_manager';

const sequelize = new Sequelize(
    process.env.DBNAME,
    process.env.DBUSER,
    process.env.DBPASSWORD,
    {
        host: process.env.DBHOST,
        port: process.env.DBPORT,
        logging: (sql, timing) => logger.info({ sql, durationMs: timing }, 'Sequelize query'),
        benchmark: true,
        timezone: 'Asia/Kolkata',
        dialect: 'postgres',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

async function connectDatabase() {
    try {
        await sequelize.authenticate();
        logger.info('Database connected');
        await sequelize.query(`ALTER DATABASE ${process.env.DBNAME} SET search_path = expense_manager;`);
    } catch (error) {
        logger.error(error, 'Unable to connect database');
        throw error;
    }
}

module.exports = {
    dbConnection: sequelize,
    connectDatabase
}
