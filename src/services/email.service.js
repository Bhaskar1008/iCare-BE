import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(config.smtp);
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      
      logger.info({ messageId: info.messageId }, 'Email sent successfully');
      return info;
    } catch (error) {
      logger.error({ error }, 'Failed to send email');
      throw error;
    }
  }

  async sendRegistrationEmail(user, otp) {
    const subject = 'Complete Your Registration';
    const html = `
      <h1>Welcome to iCare</h1>
      <p>Hello ${user.name},</p>
      <p>Your OTP for registration is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 5 minutes.</p>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }
}

export const emailService = new EmailService();