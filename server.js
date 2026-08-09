require('dotenv').config({ quiet: true });

const { validateEnvs } = require('./middlewares/validators');
validateEnvs();

const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const requestTraceMiddleware = require('./middlewares/requestTrace');
const cookieParser = require('cookie-parser');

process.on('uncaughtException', (err) => {
  logger.error(err, 'UNHANDLED EXCEPTION');
  console.error(err);
});

process.on('unhandledRejection', (err) => {
  logger.error(err, 'UNHANDLED REJECTION');
  console.error(err);
});


const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.ALLOWED_SOURCES, credentials: true }));
app.use(requestTraceMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

const { connectDatabase } = require('./config/dbConfig');


// Import Routes
const statusCheck = require('./routes/healthCheck');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');


// Assign Routes Path
app.use('/api/health', statusCheck);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);


const { errorHandler } = require("./middlewares/errorHandler");
app.use(errorHandler);

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
