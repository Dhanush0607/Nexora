// services/email.service.js
// Sends emails using Gmail via Nodemailer

const nodemailer = require('nodemailer');
const logger     = require('../utils/logger');

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EmailService = {

  /**
   * Send password reset email
   * @param {string} toEmail  - Recipient email
   * @param {string} resetURL - Password reset link
   * @param {string} name     - User's name
   */
  async sendPasswordResetEmail(toEmail, resetURL, name) {
    try {
      const mailOptions = {
        from:    process.env.EMAIL_FROM,
        to:      toEmail,
        subject: ' Nexora — Reset Your Password',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
            <div style="
              max-width: 500px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0070C0; margin: 0;">⬡ Nexora</h1>
                <p style="color: #666; margin: 4px 0;">Blockchain QR Platform</p>
              </div>

              <!-- Message -->
              <h2 style="color: #1F3864;">Hello, ${name}!</h2>
              <p style="color: #444; line-height: 1.6;">
                We received a request to reset your Nexora password.
                Click the button below to create a new password.
              </p>

              <!-- Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetURL}"
                   style="
                     background: #0070C0;
                     color: white;
                     padding: 14px 32px;
                     border-radius: 8px;
                     text-decoration: none;
                     font-weight: bold;
                     font-size: 16px;
                   ">
                  Reset My Password
                </a>
              </div>

              <!-- Warning -->
              <div style="
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
              ">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                   This link expires in <strong>15 minutes</strong>.
                  If you didn't request this, ignore this email.
                </p>
              </div>

              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
              <p style="color: #999; font-size: 12px; text-align: center;">
                Nexora — Blockchain Verified QR Platform<br/>
                BCA Final Year Project
              </p>
            </div>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Reset email sent to: ${toEmail} — ${info.messageId}`);
      return true;

    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Verify email transporter is working
   */
  async verifyConnection() {
    try {
      await transporter.verify();
      logger.info('Email service connected: Gmail ready');
      return true;
    } catch (error) {
      logger.error(`Email connection error: ${error.message}`);
      return false;
    }
  },

};

module.exports = EmailService;