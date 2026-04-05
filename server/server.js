require('dotenv').config();


const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { log } = require('console');

const PORT = process.env.PORT || 5000;

//create http server from express app
const server = http.createServer(app);

//start server
const startServer = async () => {
    try{
        await connectDB();

        server.listen(PORT, () => {
            logger.info('__________________________________________');
            logger.info(`Nexora Backend server started`);
            logger.info(`  Port:        ${PORT}`);
            logger.info(`  Environment: ${process.env.NODE_ENV}`);
            logger.info(`  URL:         http://localhost:${PORT}`);
            logger.info(`  Health:      http://localhost:${PORT}/health`);
            logger.info('─────────────────────────────────────');
        });
    } catch (error) {
        logger.error(`Server startup failed: ${error.message}`);
        process.exit(1);
     }
};
startServer();

