//defines the api endpoints for authentication

const express = require('express');
const router  = express.Router();

const { register, login ,getProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

//public routes -no token needed
router.post('/register',authLimiter,register);
router.post('/login',authLimiter,login);

//protected route - token required
router.get('/profile',protect,getProfile);

module.exports = router;