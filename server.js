require('dotenv').config({ quiet: true });
const logger = require('./utils/logger');

process.on('uncaughtException', (err) => {
  logger.error(err, 'UNHANDLED EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  logger.error(err, 'UNHANDLED REJECTION');
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { connectDatabase } = require('./config/dbConfig');


// Import Routes
const statusCheck = require('./routes/healthCheck');


// Assign Routes Path
app.use('/', statusCheck);


app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer() {
  try {
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
