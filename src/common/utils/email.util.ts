import nodemailer from 'nodemailer';
import logger from '@/common/utils/logger';

/**
 * Email utility class for sending emails
 */
export class EmailUtil {
  private static transporter: nodemailer.Transporter;

  /**
   * Initialize the email transporter
   */
  public static initialize(): void {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER ?? '',
          pass: process.env.GMAIL_APP_PASSWORD ?? '',
        },
      });
      logger.info('Email transporter initialized');
    }
  }

  /**
   * Send an email
   * @param to Recipient email address
   * @param subject Email subject
   * @param html Email HTML content
   * @param from Sender email address (defaults to GMAIL_USER from env)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendEmail(
    to: string,
    subject: string,
    html: string,
    from?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      // Initialize transporter if not already initialized
      if (!this.transporter) {
        this.initialize();
      }

      const mailOptions = {
        from: from ?? process.env.GMAIL_USER,
        to,
        subject,
        html,
      };

      logger.debug('Sending email', { to, subject });
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Failed to send email:', { error, to, subject });
      throw error;
    }
  }

  /**
   * Send an OTP verification email
   * @param to Recipient email address
   * @param otp The OTP code
   * @param subject Email subject (optional)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendOtpEmail(
    to: string,
    otp: string,
    subject = 'Your Verification OTP',
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.generateOtpEmailTemplate(otp);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Generate an OTP email template
   * @param otp The OTP code
   * @returns HTML string for the email
   */
  public static generateOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for registering with our service. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="font-size: 32px; margin: 0; color: #333;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #777;">This OTP is valid for 15 minutes. If you did not request this verification, please ignore this email.</p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} Salesverse. All rights reserved.</p>
      </div>
    `;
  }

  /**
   * Generate a custom email template
   * @param title Email title
   * @param content Main content of the email
   * @param buttonText Optional button text
   * @param buttonUrl Optional button URL
   * @returns HTML string for the email
   */
  public static generateCustomEmailTemplate(
    title: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string,
  ): string {
    const buttonHtml =
      buttonText && buttonUrl
        ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${buttonUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${buttonText}</a>
        </div>`
        : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">${title}</h2>
        <div style="font-size: 16px; line-height: 1.5; color: #555;">
          ${content}
        </div>
        ${buttonHtml}
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} Salesverse. All rights reserved.</p>
      </div>
    `;
  }

  /**
   * Send an email using SMTP configuration
   * @param to Recipient email address(es) - can be string or array of strings
   * @param cc CC email address(es) - can be string or array of strings (optional)
   * @param subject Email subject
   * @param mailBody Email body content (HTML)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendMail(
    to: string | string[],
    cc: string | string[] | undefined,
    subject: string,
    mailBody: string,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      // Create SMTP transporter with timeout configuration
      const smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Add timeout configuration to prevent hanging
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 10000, // 10 seconds
        // Add TLS options for better compatibility
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });

      const mailOptions = {
        from: process.env.SES_FROM_EMAIL ?? process.env.SMTP_USER,
        to,
        cc,
        subject,
        html: mailBody,
      };

      logger.debug('Sending SMTP email', {
        to,
        cc,
        subject,
        from: mailOptions.from,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
      });

      const info = await smtpTransporter.sendMail(mailOptions);
      logger.info('SMTP email sent successfully', {
        to,
        messageId: info.messageId,
        response: info.response,
      });

      return info;
    } catch (error) {
      const err = error as any; // Type assertion for error handling
      logger.error('Failed to send SMTP email:', {
        error,
        to,
        cc,
        subject,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
        errorCode: err.code,
        errorCommand: err.command,
      });

      // Provide more specific error messages
      if (err.code === 'ETIMEDOUT') {
        throw new Error(
          `SMTP connection timeout. Please check your SMTP configuration and network connectivity. Host: ${process.env.SMTP_HOST}`,
        );
      } else if (err.code === 'ECONNREFUSED') {
        throw new Error(
          `SMTP connection refused. Please check if the SMTP server is running and accessible. Host: ${process.env.SMTP_HOST}`,
        );
      } else if (err.command === 'CONN') {
        throw new Error(
          `SMTP connection failed. Please verify your SMTP credentials and server settings. Host: ${process.env.SMTP_HOST}`,
        );
      }

      throw error;
    }
  }
}
