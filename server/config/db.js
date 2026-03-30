const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);

        logger.info(`MongoDb Connected:${conn.connection.host}`);
        logger.info(`Database name:${conn.connection.name}`);
    } catch(error){
        logger.error(`Mongo connection Failed :${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;