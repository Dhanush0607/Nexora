require('dotenv').config();

const http              = require('http');
const app               = require('./app');
const connectDB         = require('./config/db');
const { initBlockchain } = require('./config/blockchain'); // ← ADD THIS
const logger            = require('./utils/logger');
const { initFirebase } = require('./config/firebase');
const { initSocket} = require('./socket/socketManager');
const PORT   = process.env.PORT || 5000;
const server = http.createServer(app);
const EmailService = require('./services/email.service');

const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Connect to Blockchain  ← ADD THIS
    await initBlockchain();
    initFirebase();
    await EmailService.verifyConnection(); // Check email service connection at startup

    // Step 3: Start server
    server.listen(PORT, () => {
      logger.info('─────────────────────────────────────');
      logger.info('  NEXORA Backend Server Started!');
      logger.info(`  Port:        ${PORT}`);
      logger.info(`  Environment: ${process.env.NODE_ENV}`);
      logger.info(`  URL:         http://localhost:${PORT}`);
      logger.info(`  Health:      http://localhost:${PORT}/health`);
      logger.info('─────────────────────────────────────');
    });
    initSocket(server);

  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();