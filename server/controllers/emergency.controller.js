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

const saveEmergencyProfile = async (req, res) => {

  try {

    const {
      name,
      age,
      bloodGroup,
      emergencyContact,
      medicalNotes
    } = req.body;

    const userId = req.user.id;

    // ── Step 1: Find existing profile ─────────────────────
    let profile = await UtilityProfile.findOne({ userId });

    // ── Step 2: Create profile if not exists ──────────────
    if (!profile) {

      const iv = EncryptionService.generateIV();

      profile = new UtilityProfile({
        userId,
        iv,
        selectedUtilities: ['emergency'],
      });

    }

    // ── Step 3: Encrypt emergency fields ──────────────────
    profile.emergency = {
      encryptedName: EncryptionService.encryptWithIV(
        name,
        profile.iv

      ),

      encryptedAge: EncryptionService.encryptWithIV(
        age.toString(),
        profile.iv
      ),

      encryptedBloodGroup: EncryptionService.encryptWithIV(
        bloodGroup,
        profile.iv
      ),

      encryptedEmergencyContact: EncryptionService.encryptWithIV(
        emergencyContact,
        profile.iv
      ),

      encryptedMedicalNotes: EncryptionService.encryptWithIV(
        medicalNotes,
        profile.iv
      ),
    };

    // ── Step 4: Ensure utility enabled ────────────────────
    if (!profile.selectedUtilities.includes('emergency')) {

      profile.selectedUtilities.push('emergency');
    }

    // ── Step 5: Save profile ──────────────────────────────
    await profile.save();

    logger.info(`Emergency profile saved for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency profile saved successfully.',
    });

  } catch (error) {

    logger.error(`Emergency save error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Could not save emergency profile.',
    });
  }
};

const getMyEmergencyProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const profile = await UtilityProfile.findOne({ userId });

    if (!profile || !profile.emergency) {

      return res.status(404).json({
        success: false,
        message: 'No emergency profile found.'
      });
    }

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

    res.status(200).json({
      success: true,
      emergency
    });

  } catch (error) {

    logger.error(`Get my emergency profile error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Could not retrieve profile.'
    });
  }
};

module.exports = { getEmergencyProfile, saveEmergencyProfile, getMyEmergencyProfile };