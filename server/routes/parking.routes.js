// routes/parking.routes.js
const express = require('express');
const router  = express.Router();

const { sendParkingNotification } = require('../controllers/parking.controller');

// Public — scanner doesn't need to be logged in
router.post('/notify/:userId', sendParkingNotification);

module.exports = router;