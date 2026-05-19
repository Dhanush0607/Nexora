// routes/emergency.routes.js
// Public route — no login needed
// First responders can access without an account

const express = require('express');
const router  = express.Router();
const { protect} = require('../middleware/authMiddleware');
const { getEmergencyProfile,getMyEmergencyProfile,saveEmergencyProfile } = require('../controllers/emergency.controller');

// Public — anyone who scans QR can access emergency profile
router.get('/profile/:userId', getEmergencyProfile);
router.get('/my-profile', protect, getMyEmergencyProfile);
router.post('/save', protect, saveEmergencyProfile);

module.exports = router;