// routes/emergency.routes.js
// Public route — no login needed
// First responders can access without an account

const express = require('express');
const router  = express.Router();

const { getEmergencyProfile } = require('../controllers/emergency.controller');

// Public — anyone who scans QR can access emergency profile
router.get('/profile/:userId', getEmergencyProfile);

module.exports = router;