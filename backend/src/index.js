const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
const path = require('path');
const config = require('./config/config');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { globalLimiter } = require('./utils/rateLimiter');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initializeAdmin } = require('./controllers/authController');

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// Create Express server
const app = express();

// Set port
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.server.corsOrigin,
  optionsSuccessStatus: 200
}));
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply rate limiting
app.use(globalLimiter(
  config.rateLimit.global.maxRequests,
  config.rateLimit.global.windowMs
));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'zk-SNARKs Anonymous Authentication API',
      version: '1.0.0',
      description: 'API documentation for anonymous authentication using zk-SNARKs',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize admin account
    await initializeAdmin();
    logger.info('Admin initialization check completed');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

module.exports = app; 