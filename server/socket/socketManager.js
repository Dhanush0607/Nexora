// socket/socketManager.js
// Sets up Socket.IO on the HTTP server

const { Server }       = require('socket.io');
const { initSignaling } = require('./signaling');
const logger           = require('../utils/logger');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin:  process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  logger.info('Socket.IO initialized');

  // Initialize WebRTC signaling
  initSignaling(io);

  return io;
};

module.exports = { initSocket };