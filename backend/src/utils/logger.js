const winston = require('winston');
const path = require('path');
const SystemLog = require('../models/SystemLog');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define different transport options
const options = {
  file: {
    level: 'info',
    filename: path.join(__dirname, '../../logs/app.log'),
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  },
};

// Create a Winston logger
const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// Helper to log system events to database
const logSystemEvent = async (level, message, details = '') => {
  try {
    await SystemLog.create({
      level,
      message,
      details
    });
  } catch (error) {
    logger.error(`Failed to log event: ${error.message}`);
  }
};

module.exports = logger;
module.exports.logSystemEvent = logSystemEvent; 