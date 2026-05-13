//public route-no auth needed
//Anyone who scans the qr can verify it

const express = require('express');
const router = express.Router();
const { scanAndVerify} = require('../controllers/verify.controller');

//public route -- scanner doesn't need to be logged in
router.post('/scan',scanAndVerify);
module.exports = router;