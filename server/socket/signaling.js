// socket/signaling.js
// WebRTC signaling server using Socket.IO
// Exchanges offer/answer/ICE candidates between host and visitor

const logger = require('../utils/logger');

const initSignaling = (io) => {

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Host joins a room with their session token
    socket.on('join-room', ({ sessionToken, role }) => {
      socket.join(sessionToken);
      logger.info(`${role} joined room: ${sessionToken}`);

      // Notify host when visitor arrives
      if (role === 'visitor') {
        socket.to(sessionToken).emit('visitor-arrived', {
          message: 'Someone is at the door!',
          socketId: socket.id,
        });
      }
    });

    // Host sends WebRTC offer to visitor
    socket.on('send-offer', ({ sessionToken, offer }) => {
      socket.to(sessionToken).emit('receive-offer', { offer });
      logger.info(`Offer sent in room: ${sessionToken}`);
    });

    // Visitor sends WebRTC answer back to host
    socket.on('send-answer', ({ sessionToken, answer }) => {
      socket.to(sessionToken).emit('receive-answer', { answer });
      logger.info(`Answer sent in room: ${sessionToken}`);
    });

    // Exchange ICE candidates
    socket.on('send-ice-candidate', ({ sessionToken, candidate }) => {
      socket.to(sessionToken).emit('receive-ice-candidate', { candidate });
    });

    // End call
    socket.on('end-call', ({ sessionToken }) => {
      socket.to(sessionToken).emit('call-ended');
      logger.info(`Call ended in room: ${sessionToken}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

};

module.exports = { initSignaling };