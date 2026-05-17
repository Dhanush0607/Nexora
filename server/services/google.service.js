const { OAuth2Client } = require('google-auth-library');
const logger           = require('../utils/logger');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GoogleService = {
  async verifyToken(idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        googleId: payload.sub,
        email:    payload.email,
        name:     payload.name,
        picture:  payload.picture,
        verified: payload.email_verified,
      };

    } catch (error) {
      logger.error(`Google token verification failed: ${error.message}`);
      throw new Error('Invalid Google token');
    }
  },
};

module.exports = GoogleService;