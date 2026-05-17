// controllers/admin.controller.js
// All admin operations

const User           = require('../models/User.model');
const UtilityProfile = require('../models/UtilityProfile.model');
const QRRecord       = require('../models/QRRecord.model');
const Session        = require('../models/Session.model');
const logger         = require('../utils/logger');

// ── GET DASHBOARD STATS ──────────────────────────────────────
// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    // Count all collections in parallel
    const [
      totalUsers,
      activeUsers,
      totalQRCodes,
      totalProfiles,
      activeSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      QRRecord.countDocuments(),
      UtilityProfile.countDocuments(),
      Session.countDocuments({ status: 'active' }),
    ]);

    // Calculate total scans
    const scanResult = await QRRecord.aggregate([
      { $group: { _id: null, totalScans: { $sum: '$scanCount' } } }
    ]);
    const totalScans = scanResult[0]?.totalScans || 0;

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers  = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    logger.info(`Admin stats fetched by: ${req.user.email}`);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers:   totalUsers - activeUsers,
        totalQRCodes,
        totalScans,
        totalProfiles,
        activeSessions,
        recentUsers,     // New users in last 7 days
      },
    });

  } catch (error) {
    logger.error(`Admin stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch stats.',
    });
  }
};

// ── GET ALL USERS ────────────────────────────────────────────
// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Search
    const search = req.query.search || '';
    const query  = search
      ? { email: { $regex: search, $options: 'i' } }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')   // Never return password
        .sort({ createdAt: -1 })   // Newest first
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(total / limit),
        totalUsers:  total,
        limit,
      },
    });

  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch users.',
    });
  }
};

// ── GET SINGLE USER DETAILS ──────────────────────────────────
// GET /api/admin/users/:userId
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, qrRecord, profile] = await Promise.all([
      User.findById(userId).select('-passwordHash'),
      QRRecord.findOne({ userId }),
      UtilityProfile.findOne({ userId }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
      qrRecord:  qrRecord  || null,
      hasProfile: !!profile,
      selectedUtilities: profile?.selectedUtilities || [],
    });

  } catch (error) {
    logger.error(`Get user details error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch user details.',
    });
  }
};

// ── ACTIVATE / DEACTIVATE USER ───────────────────────────────
// PATCH /api/admin/users/:userId/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Toggle isActive
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    logger.info(
      `Admin ${req.user.email} ${user.isActive ? 'activated' : 'deactivated'} user: ${user.email}`
    );

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });

  } catch (error) {
    logger.error(`Toggle user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not update user status.',
    });
  }
};

// ── DELETE USER ──────────────────────────────────────────────
// DELETE /api/admin/users/:userId
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    // Delete user and all related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      UtilityProfile.findOneAndDelete({ userId }),
      QRRecord.findOneAndDelete({ userId }),
      Session.deleteMany({ userId }),
    ]);

    logger.info(`Admin ${req.user.email} deleted user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully.',
    });

  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not delete user.',
    });
  }
};

// ── GET ALL QR RECORDS ───────────────────────────────────────
// GET /api/admin/qr-records
const getAllQRRecords = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      QRRecord.find()
        .populate('userId', 'fullName email')  // Join with User collection
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      QRRecord.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      records,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    });

  } catch (error) {
    logger.error(`Get QR records error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch QR records.',
    });
  }
};

// ── EXPIRE A QR CODE ─────────────────────────────────────────
// PATCH /api/admin/qr-records/:recordId/expire
const expireQRCode = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await QRRecord.findByIdAndUpdate(
      recordId,
      { isExpired: true },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'QR record not found.',
      });
    }

    logger.info(`Admin expired QR record: ${recordId}`);

    res.status(200).json({
      success: true,
      message: 'QR code expired successfully.',
    });

  } catch (error) {
    logger.error(`Expire QR error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not expire QR code.',
    });
  }
};

// ── GET ACTIVITY LOGS ────────────────────────────────────────
// GET /api/admin/activity
const getActivityLogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Get recent QR records as activity
    const recentQR = await QRRecord.find()
      .populate('userId', 'fullName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('userId selectedUtilities scanCount blockchainTxHash createdAt lastScannedAt');

    // Format as activity logs
    const logs = recentQR.map(record => ({
      type:       'QR_ACTIVITY',
      user:       record.userId?.fullName || 'Unknown',
      email:      record.userId?.email    || 'Unknown',
      utilities:  record.selectedUtilities,
      scanCount:  record.scanCount,
      txHash:     record.blockchainTxHash,
      createdAt:  record.createdAt,
      lastScanned: record.lastScannedAt,
    }));

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(await QRRecord.countDocuments() / limit),
      },
    });

  } catch (error) {
    logger.error(`Activity logs error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not fetch activity logs.',
    });
  }
};

// ── MAKE USER ADMIN ──────────────────────────────────────────
// PATCH /api/admin/users/:userId/make-admin
const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    logger.info(`Admin ${req.user.email} made ${user.email} an admin`);

    res.status(200).json({
      success: true,
      message: `${user.fullName} is now an admin.`,
      user,
    });

  } catch (error) {
    logger.error(`Make admin error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not update user role.',
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  deleteUser,
  getAllQRRecords,
  expireQRCode,
  getActivityLogs,
  makeAdmin,
};