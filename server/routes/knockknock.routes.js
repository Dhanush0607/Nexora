// routes/knockknock.routes.js
const express = require('express');
const router  = express.Router();

const {
  createSession,
  joinSession,
  endSession,
  updatePeerId,
} = require('../controllers/knockknock.controller');

const { protect } = require('../middleware/authMiddleware');

// Protected — only logged-in user creates/ends sessions
router.post('/create',  protect, createSession);
router.post('/end',     protect, endSession);
router.patch('/peer',   protect, updatePeerId);

// Public — visitor joins with token from QR
router.get('/join/:token', joinSession);

module.exports = router;