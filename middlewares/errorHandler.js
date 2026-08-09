const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Something went wrong";
  err.errorCode = err.errorCode || "Error";

  if (err.isOperational) {
    logger.error(err);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.errorCode
    });
  }

  logger.error(err, 'UNHANDLED EXCEPTION');
  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: err.errorCode
  });
};


module.exports = {
  errorHandler
};

