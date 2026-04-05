//defines the api endpoints for authentication

const express = require('express');
const router  = express.Router();

const { register, login ,getProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

//public routes -no token needed
router.post('/register',register);
router.post('/login',login);

//protected route - token required
router.get('/profile',protect,getProfile);

module.exports = router;