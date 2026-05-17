// controllers/parking.controller.js
// Sends anonymous push notification to vehicle owner

const UtilityProfile        = require('../models/UtilityProfile.model');
const EncryptionService     = require('../services/encryption.service');
const NotificationService   = require('../services/notification.service');
const logger                = require('../utils/logger');

// POST /api/parking/notify/:userId
const sendParkingNotification = async (req, res) => {
  try {
    const { userId }  = req.params;
    const { message } = req.body;

    // ── Step 1: Validate message length ─────────────────────
    if (message && message.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Max 200 characters.',
      });
    }

    // ── Step 2: Find utility profile ─────────────────────────
    const profile = await UtilityProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Parking profile not found.',
      });
    }

    // ── Step 3: Check smart parking is active ────────────────
    if (!profile.selectedUtilities.includes('smartParking')) {
      return res.status(400).json({
        success: false,
        message: 'Smart Parking utility not enabled for this QR.',
      });
    }

    // ── Step 4: Check FCM token exists ───────────────────────
    if (!profile.smartParking ||
        !profile.smartParking.encryptedFcmToken) {
      return res.status(404).json({
        success: false,
        message: 'Owner notification not set up.',
      });
    }

    // ── Step 5: Decrypt FCM token ────────────────────────────
    const fcmToken = EncryptionService.decrypt(
      profile.iv,
      profile.smartParking.encryptedFcmToken
    );

    // ── Step 6: Send notification ────────────────────────────
    await NotificationService.sendParkingNotification(
      fcmToken,
      message || null
    );

    logger.info(`Parking notification sent for user: ${userId}`);

    // ── Step 7: Return success ───────────────────────────────
    // Note: we never expose owner's contact to scanner
    res.status(200).json({
      success: true,
      message: 'Vehicle owner has been notified anonymously.',
    });

  } catch (error) {
    logger.error(`Parking notification error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not send notification. Please try again.',
    });
  }
};

module.exports = { sendParkingNotification };