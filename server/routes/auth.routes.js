//defines the api endpoints for authentication

const express = require('express');
const router  = express.Router();

const { register, login ,getProfile,googleSignIn,forgotPassword,resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

//public routes -no token needed
router.post('/register',authLimiter,register);
router.post('/googleSignIn',authLimiter,googleSignIn);
router.post('/login',authLimiter,login);
router.post('/google',authLimiter,googleSignIn);
router.post('/forgot-password',authLimiter,forgotPassword);
router.post('/reset-password',authLimiter,resetPassword);

//protected route - token required
router.get('/profile',protect,getProfile);

module.exports = router;