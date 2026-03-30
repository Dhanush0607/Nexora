const { createLogger, format, transports } = require('winston');4

const logger = createLogger({
    level :'info',
    format : format.combine(
        format.timestamp({ format:'YYYY-MM-DD HH:mm:ss'}),
        format.colorize(),
        format.printf(({ timestamp,level,message}) => {
            return `[${timestamp}] ${level}:${message}`;
        })
    ),
    transports:[
        new transports.Console(),
    ],
});
module.exports = logger;