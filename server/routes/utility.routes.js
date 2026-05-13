const express = require('express');
const router =  express.Router();

const { submitUtilityData } = require('../controllers/utility.controller');
const { protect } = require('../middleware/authMiddleware');

//protected - must be logged in to submit utility data
router.post('/submit',protect,submitUtilityData);

module.exports = router;