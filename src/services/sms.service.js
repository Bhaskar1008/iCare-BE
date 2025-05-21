import twilio from 'twilio';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class SMSService {
  constructor() {
    this.client = twilio(config.sms.accountSid, config.sms.authToken);
    this.templates = {};
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(process.cwd(), 'src/templates/sms');
      const files = await fs.readdir(templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templateContent = await fs.readFile(
            path.join(templatesDir, file),
            'utf-8'
          );
          this.templates[templateName] = Handlebars.compile(templateContent);
        }
      }

      logger.info('SMS templates loaded successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to load SMS templates');
      throw error;
    }
  }

  async sendSMS({ to, template, context }) {
    try {
      if (!this.templates[template]) {
        throw new Error(`Template ${template} not found`);
      }

      const message = this.templates[template](context);

      const result = await this.client.messages.create({
        body: message,
        to,
        from: config.sms.from,
      });

      logger.info({
        messageId: result.sid,
        to,
        template,
      }, 'SMS sent successfully');

      return result;
    } catch (error) {
      logger.error({
        error,
        to,
        template,
      }, 'Failed to send SMS');
      throw error;
    }
  }

  async sendOTP(phone, otp) {
    return this.sendSMS({
      to: phone,
      template: 'otp',
      context: {
        otp,
        expiryMinutes: 5,
        companyName: config.company.name,
      },
    });
  }

  async sendLeadAssignment(phone, lead) {
    return this.sendSMS({
      to: phone,
      template: 'lead-assignment',
      context: {
        leadName: lead.name,
        leadCode: lead.code,
        dashboardUrl: config.app.url,
      },
    });
  }

  async sendAppointmentReminder(phone, appointment) {
    return this.sendSMS({
      to: phone,
      template: 'appointment-reminder',
      context: {
        customerName: appointment.customerName,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
      },
    });
  }

  async sendPolicyRenewalReminder(phone, policy) {
    return this.sendSMS({
      to: phone,
      template: 'policy-renewal',
      context: {
        policyNumber: policy.number,
        expiryDate: policy.expiryDate,
        renewalAmount: policy.renewalAmount,
        dashboardUrl: config.app.url,
      },
    });
  }
}

export const smsService = new SMSService();