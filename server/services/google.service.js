// services/google.service.js
// Verifies Google ID token sent from frontend

const { OAuth2Client } = require('google-auth-library');
const logger           = require('../utils/logger');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GoogleService = {

  /**
   * Verify Google ID token from frontend
   * Frontend sends this token after user clicks "Sign in with Google"
   * 
   * @param {string} idToken - Token from Google Identity button
   * @returns {object} - { email, name, googleId, picture }
   */
  async verifyToken(idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        googleId: payload.sub,           // Unique Google user ID
        email:    payload.email,          // User's Gmail
        name:     payload.name,           // Full name
        picture:  payload.picture,        // Profile photo URL
        verified: payload.email_verified, // Is email verified?
      };

    } catch (error) {
      logger.error(`Google token verification failed: ${error.message}`);
      throw new Error('Invalid Google token');
    }
  },

};

module.exports = GoogleService;