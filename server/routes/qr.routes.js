const express = require('express');
const router = express.Router();

const { getMyQR } = require('../controllers/qr.controller');
const { protect } = require('../middleware/authMiddleware');

//Protected - must be logged into get qr
router.get('/my-qr',protect,getMyQR);

module.exports = router;