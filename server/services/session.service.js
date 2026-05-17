// services/session.service.js
// Creates and manages WebRTC sessions

const crypto  = require('crypto');
const Session = require('../models/Session.model');
const logger  = require('../utils/logger');

const SessionService = {

  // Create a new Knock Knock session
  async createSession(userId, sessionLabel, durationMinutes = 10) {
    try {
      // Generate unique session token
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Calculate expiry
      const expiresAt = new Date(
        Date.now() + durationMinutes * 60 * 1000
      );

      // Save to MongoDB
      const session = await Session.create({
        userId,
        sessionToken,
        sessionLabel:    sessionLabel || 'My Door',
        durationMinutes,
        expiresAt,
        status:          'active',
      });

      logger.info(`Session created: ${sessionToken}`);
      return session;

    } catch (error) {
      logger.error(`Session creation error: ${error.message}`);
      throw error;
    }
  },

  // Get session by token
  async getSession(sessionToken) {
    const session = await Session.findOne({
      sessionToken,
      status: 'active',
    });
    return session;
  },

  // End a session
  async endSession(sessionToken) {
    await Session.findOneAndUpdate(
      { sessionToken },
      { status: 'ended', endedAt: new Date() }
    );
  },

  // Update peerId when host connects
  async updatePeerId(sessionToken, peerId) {
    await Session.findOneAndUpdate(
      { sessionToken },
      { peerId }
    );
  },

};

module.exports = SessionService;