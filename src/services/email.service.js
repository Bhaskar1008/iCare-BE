import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });

    // Initialize templates
    this.templates = {};
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(process.cwd(), 'src/templates/email');
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

      logger.info('Email templates loaded successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to load email templates');
      throw error;
    }
  }

  async sendEmail({
    to,
    subject,
    template,
    context,
    attachments = [],
    cc = [],
    bcc = [],
  }) {
    try {
      if (!this.templates[template]) {
        throw new Error(`Template ${template} not found`);
      }

      const html = this.templates[template](context);

      const mailOptions = {
        from: config.smtp.from,
        to,
        cc,
        bcc,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info({
        messageId: info.messageId,
        to,
        subject,
        template,
      }, 'Email sent successfully');

      return info;
    } catch (error) {
      logger.error({
        error,
        to,
        subject,
        template,
      }, 'Failed to send email');
      throw error;
    }
  }

  async sendRegistrationEmail(user, otp) {
    return this.sendEmail({
      to: user.email,
      subject: 'Complete Your iCare Registration',
      template: 'registration',
      context: {
        name: user.name,
        otp,
        expiryMinutes: 5,
        supportEmail: config.support.email,
        supportPhone: config.support.phone,
      },
    });
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to iCare!',
      template: 'welcome',
      context: {
        name: user.name,
        loginUrl: config.app.url + '/login',
        supportEmail: config.support.email,
        supportPhone: config.support.phone,
      },
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your iCare Password',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl: `${config.app.url}/reset-password?token=${resetToken}`,
        expiryHours: 24,
        supportEmail: config.support.email,
        supportPhone: config.support.phone,
      },
    });
  }

  async sendLeadAssignmentEmail(user, lead) {
    return this.sendEmail({
      to: user.email,
      subject: 'New Lead Assigned',
      template: 'lead-assignment',
      context: {
        agentName: user.name,
        leadName: lead.name,
        leadCode: lead.code,
        leadType: lead.type,
        dashboardUrl: `${config.app.url}/leads`,
        supportEmail: config.support.email,
        supportPhone: config.support.phone,
      },
    });
  }
}

export const emailService = new EmailService();