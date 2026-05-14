// services/notification.service.js
// Sends FCM push notifications for Smart Parking

const { getFirebase } = require('../config/firebase');
const logger          = require('../utils/logger');

const NotificationService = {

  // Send parking notification to vehicle owner
  async sendParkingNotification(fcmToken, message = null) {
    try {
      const admin = getFirebase();

      const notification = {
        token: fcmToken,
        notification: {
          title: '🅿️ Nexora Parking Alert',
          body:  message || 'Someone has scanned your parking QR code.',
        },
        data: {
          type:      'parking_alert',
          timestamp: new Date().toISOString(),
          message:   message || 'Someone needs your attention.',
        },
        android: {
          priority: 'high',
          notification: {
            sound:    'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(notification);
      logger.info(`Parking notification sent: ${response}`);
      return response;

    } catch (error) {
      logger.error(`Notification error: ${error.message}`);
      throw error;
    }
  },

};

module.exports = NotificationService;