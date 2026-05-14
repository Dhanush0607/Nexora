// config/firebase.js
// Firebase Admin SDK initialization
// Used for sending FCM push notifications

const admin  = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;

const initFirebase = () => {
  try {
    const serviceAccount = require('./nexora-firebase-key.json');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized');

  } catch (error) {
    logger.error(`Firebase init error: ${error.message}`);
  }
};

const getFirebase = () => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  return admin;
};

module.exports = { initFirebase, getFirebase };