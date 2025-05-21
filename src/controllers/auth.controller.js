import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { OTP } from '../models/otp.model.js';
import { emailService } from '../services/email.service.js';
import { smsService } from '../services/sms.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const authController = {
  async requestOTP(req, res) {
    try {
      const { agentCode } = req.body;
      
      const user = await User.findOne({ agentCode });
      if (!user) {
        return res.status(404).json({ message: 'Agent not found' });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await OTP.create({
        agentCode,
        otp,
        type: 'EMAIL',
        expiresAt,
      });

      await emailService.sendRegistrationEmail(user, otp);
      await smsService.sendOTP(user.phone, otp);

      logger.info({ agentCode }, 'OTP sent successfully');
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      logger.error({ error }, 'Failed to send OTP');
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  },

  async verifyOTP(req, res) {
    try {
      const { agentCode, otp } = req.body;

      const otpRecord = await OTP.findOne({
        agentCode,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      const user = await User.findOne({ agentCode });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      otpRecord.isUsed = true;
      await otpRecord.save();

      const token = jwt.sign(
        { id: user._id, agentCode: user.agentCode },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      logger.info({ agentCode }, 'OTP verified successfully');
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          agentCode: user.agentCode,
        },
      });
    } catch (error) {
      logger.error({ error }, 'OTP verification failed');
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  },
};