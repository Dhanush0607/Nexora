// routes/admin.routes.js
const express = require('express');
const router  = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  deleteUser,
  getAllQRRecords,
  expireQRCode,
  getActivityLogs,
  makeAdmin,
} = require('../controllers/admin.controller');

const { protect }  = require('../middleware/authMiddleware');
const { isAdmin }  = require('../middleware/adminMiddleware');

// All admin routes need:
// 1. protect    → must be logged in
// 2. isAdmin    → must be an admin
router.use(protect, isAdmin);

// Stats
router.get('/stats',                    getDashboardStats);

// User management
router.get('/users',                    getAllUsers);
router.get('/users/:userId',            getUserDetails);
router.patch('/users/:userId/toggle',   toggleUserStatus);
router.delete('/users/:userId',         deleteUser);
router.patch('/users/:userId/make-admin', makeAdmin);

// QR management
router.get('/qr-records',              getAllQRRecords);
router.patch('/qr-records/:recordId/expire', expireQRCode);

// Activity logs
router.get('/activity',                getActivityLogs);

module.exports = router;