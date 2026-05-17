// controllers/emergency.controller.js
// Returns decrypted emergency profile after QR verification
// Called when scanner sees "emergency" in selectedUtilities

const UtilityProfile    = require('../models/UtilityProfile.model');
const EncryptionService = require('../services/encryption.service');
const logger            = require('../utils/logger');

// GET /api/emergency/profile/:userId
// Public route — called after QR verification
const getEmergencyProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // ── Step 1: Find utility profile ────────────────────────
    const profile = await UtilityProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Emergency profile not found.',
      });
    }

    // ── Step 2: Check emergency utility is active ────────────
    if (!profile.selectedUtilities.includes('emergency')) {
      return res.status(400).json({
        success: false,
        message: 'Emergency utility not enabled for this QR.',
      });
    }

    // ── Step 3: Check emergency data exists ──────────────────
    if (!profile.emergency || !profile.emergency.encryptedName) {
      return res.status(404).json({
        success: false,
        message: 'Emergency data not found.',
      });
    }

    // ── Step 4: Decrypt all emergency fields ─────────────────
    const emergency = {
      name: EncryptionService.decrypt(
        profile.iv,
        profile.emergency.encryptedName
      ),
      age: EncryptionService.decrypt(
        profile.iv,
        profile.emergency.encryptedAge
      ),
      bloodGroup: EncryptionService.decrypt(
        profile.iv,
        profile.emergency.encryptedBloodGroup
      ),
      emergencyContact: EncryptionService.decrypt(
        profile.iv,
        profile.emergency.encryptedEmergencyContact
      ),
      medicalNotes: EncryptionService.decrypt(
        profile.iv,
        profile.emergency.encryptedMedicalNotes
      ),
    };

    logger.info(`Emergency profile accessed for user: ${userId}`);

    // ── Step 5: Return decrypted data ────────────────────────
    res.status(200).json({
      success: true,
      message: 'Emergency profile retrieved successfully.',
      emergency,
    });

  } catch (error) {
    logger.error(`Emergency profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve emergency profile.',
    });
  }
};

module.exports = { getEmergencyProfile };