// controllers/knockknock.controller.js
// Manages WebRTC session creation, joining, and ending

const SessionService = require('../services/session.service');
const logger         = require('../utils/logger');

// POST /api/knockknock/create
// Protected — only logged-in user creates session
const createSession = async (req, res) => {
  try {
    const userId   = req.user._id;
    const { sessionLabel, durationMinutes } = req.body;

    const session = await SessionService.createSession(
      userId,
      sessionLabel,
      durationMinutes || 10
    );

    // Session link shared with visitor
    const sessionLink = `${process.env.CLIENT_URL}/pages/knockknock.html?token=${session.sessionToken}`;

    logger.info(`KnockKnock session created for user: ${userId}`);

    res.status(201).json({
      success:      true,
      message:      'Session created successfully!',
      sessionToken: session.sessionToken,
      sessionLink,
      sessionLabel: session.sessionLabel,
      expiresAt:    session.expiresAt,
      durationMinutes: session.durationMinutes,
    });

  } catch (error) {
    logger.error(`Create session error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not create session.',
    });
  }
};

// GET /api/knockknock/join/:token
// Public — visitor joins using session token from QR
const joinSession = async (req, res) => {
  try {
    const { token } = req.params;

    const session = await SessionService.getSession(token);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already expired.',
      });
    }

    // Check if session is still valid
    if (new Date() > session.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Session has expired.',
      });
    }

    logger.info(`Visitor joining session: ${token}`);

    res.status(200).json({
      success:      true,
      message:      'Session found! Connecting...',
      sessionToken: session.sessionToken,
      sessionLabel: session.sessionLabel,
      peerId:       session.peerId,
      expiresAt:    session.expiresAt,
    });

  } catch (error) {
    logger.error(`Join session error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not join session.',
    });
  }
};

// POST /api/knockknock/end
// Protected — only session owner can end it
const endSession = async (req, res) => {
  try {
    const { sessionToken } = req.body;

    await SessionService.endSession(sessionToken);

    logger.info(`Session ended: ${sessionToken}`);

    res.status(200).json({
      success: true,
      message: 'Session ended.',
    });

  } catch (error) {
    logger.error(`End session error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not end session.',
    });
  }
};

// PATCH /api/knockknock/peer
// Called by frontend when PeerJS connection is ready
const updatePeerId = async (req, res) => {
  try {
    const { sessionToken, peerId } = req.body;

    await SessionService.updatePeerId(sessionToken, peerId);

    res.status(200).json({
      success: true,
      message: 'Peer ID updated.',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update peer ID.',
    });
  }
};

module.exports = {
  createSession,
  joinSession,
  endSession,
  updatePeerId,
};