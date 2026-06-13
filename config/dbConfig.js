const Sequelize = require('sequelize');
const schemaName = process.env.DBSCHEMA || 'expenseManager';

const sequelize = new Sequelize(
    process.env.DBNAME,
    process.env.DBUSER,
    process.env.DBPASSWORD,
    {
        host: process.env.DBHOST,
        port: process.env.DBPORT,
        logging: false,
        timezone: 'Asia/Kolkata',
        dialect: 'postgres',
        searchPath: schemaName,
        dialectOptions: {
            prependSearchPath: true
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

async function connectDatabase() {
    await sequelize.authenticate();
    console.log('Connected with the database!');
}

module.exports = {
    dbConnection: sequelize,
    connectDatabase
}
