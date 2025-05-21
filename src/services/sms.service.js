import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class SMSService {
  async sendSMS(to, message) {
    try {
      // Implement your SMS gateway integration here
      logger.info({ to, message }, 'SMS sent successfully');
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to send SMS');
      throw error;
    }
  }

  async sendOTP(phone, otp) {
    const message = `Your iCare verification code is: ${otp}. Valid for 5 minutes.`;
    return this.sendSMS(phone, message);
  }
}

export const smsService = new SMSService();