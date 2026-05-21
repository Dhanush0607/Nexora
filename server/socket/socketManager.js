// socket/socketManager.js
// Sets up Socket.IO on the HTTP server

const { Server }       = require('socket.io');
const { initSignaling } = require('./signaling');
const logger           = require('../utils/logger');

const initSocket = (server) => {
  const io = new Server(server, {
  cors: {
    origin: [
      'http://192.168.1.102:5500',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST'],
  },
});

  logger.info('Socket.IO initialized');

  // Initialize WebRTC signaling
  initSignaling(io);

  return io;
};

module.exports = { initSocket };