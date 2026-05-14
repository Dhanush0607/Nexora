// models/Session.model.js
// WebRTC session with TTL expiry

const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    sessionToken: {
      type:     String,
      required: true,
      unique:   true,
    },

    sessionLabel: {
      type:    String,
      default: 'My Door',
    },

    peerId: {
      type: String,
    },

    status: {
      type:    String,
      enum:    ['active', 'expired', 'ended'],
      default: 'active',
    },

    durationMinutes: {
      type:    Number,
      default: 10,
    },

    expiresAt: {
      type:     Date,
      required: true,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB auto-deletes expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', SessionSchema);