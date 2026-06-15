require('dotenv').config({ quiet: true });

const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const requestTraceMiddleware = require('./middlewares/requestTrace');

process.on('uncaughtException', (err) => {
  logger.error(err, 'UNHANDLED EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  logger.error(err, 'UNHANDLED REJECTION');
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(requestTraceMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

const { connectDatabase } = require('./config/dbConfig');


// Import Routes
const statusCheck = require('./routes/healthCheck');


// Assign Routes Path
app.use('/health', statusCheck);


app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  logger.error(error, 'Unhandled request error');

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: process.env.ENV_CONFIG === 'PROD' ? 'Internal server error' : error.message
  });
});

async function startServer() {
  try {
    if (!process.env.DBSCHEMA || !process.env.DBNAME || !process.env.DBUSER || !process.env.DBPASSWORD || !process.env.DBHOST || !process.env.DBPORT) {
      throw new Error('Invalid Database Configuration');
    }
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server started');
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
