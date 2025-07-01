import { EmailUtil } from '@/common/utils/email.util';
import logger from '@/common/utils/logger';

/**
 * AOB Email Templates
 * Contains all email templates for the AOB module
 */
export class AobEmailTemplates {
  /**
   * Send OTP verification email
   * @param email Recipient email address
   * @param otp The OTP code
   * @param subject Email subject (optional)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendOtpEmail(
    email: string,
    otp: string,
    subject = 'Your Verification OTP',
  ): Promise<any> {
    try {
      const html = this.generateOtpEmailTemplate(otp);
      return await EmailUtil.sendMail(email, '', subject, html);
    } catch (error) {
      logger.error('Failed to send OTP email:', { error, email });
      throw error;
    }
  }

  /**
   * Send shareable link email
   * @param email Recipient email address
   * @param link The shareable link
   * @param subject Email subject (optional)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendShareableLinkEmail(
    email: string,
    link: string,
    subject = 'Shareable Link',
  ): Promise<any> {
    try {
      const html = this.generateShareableLinkEmailTemplate(link);
      return await EmailUtil.sendMail(email, undefined, subject, html);
    } catch (error) {
      logger.error('Failed to send shareable link email:', { error, email });
      throw error;
    }
  }

  /**
   * Send onboarding email for approved applications
   * @param email Recipient email address
   * @param firstName Applicant's first name
   * @param lastName Applicant's last name
   * @param agentCode The agent code
   * @param subject Email subject (optional)
   * @returns Promise resolving to the nodemailer info object
   */
  public static async sendOnboardingEmail(
    email: string,
    firstName: string,
    lastName: string,
    agentCode: string,
    subject = 'Welcome to Salesverse - Your Application is Approved!',
  ): Promise<any> {
    try {
      const html = this.generateOnboardingEmailTemplate(
        firstName,
        lastName,
        agentCode,
      );
      return await EmailUtil.sendMail(email, undefined, subject, html);
    } catch (error) {
      logger.error('Failed to send onboarding email:', { error, email });
      throw error;
    }
  }

  /**
   * Generate OTP email template
   * @param otp The OTP code
   * @returns HTML string for the email
   */
  private static generateOtpEmailTemplate(otp: string): string {
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
   * Generate shareable link email template
   * @param link The shareable link
   * @returns HTML string for the email
   */
  private static generateShareableLinkEmailTemplate(link: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Shareable Link</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">You have received a shareable link. Please click the button below to access the content:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Link</a>
        </div>
        <p style="font-size: 14px; color: #777;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #777; word-break: break-all;">${link}</p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} Salesverse. All rights reserved.</p>
      </div>
    `;
  }

  /**
   * Generate onboarding email template for approved applications
   * @param firstName Applicant's first name
   * @param lastName Applicant's last name
   * @param agentCode The agent code
   * @returns HTML string for the email
   */
  private static generateOnboardingEmailTemplate(
    firstName: string,
    lastName: string,
    agentCode: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Application Approved - Welcome to Salesverse!</h2>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Dear ${firstName} ${lastName},</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Congratulations! We are pleased to inform you that your application has been approved. You are now officially part of our team.</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;"><strong>Your Agent Details:</strong></p>
        <ul style="font-size: 16px; line-height: 1.5; color: #555;">
          <li><strong>Agent Code:</strong> ${agentCode}</li>
        </ul>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Please keep your agent code safe as you will need it to log in to our system. You will receive further instructions on how to set up your account and get started.</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">We look forward to your success with us!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://salesverse.com/login" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Your Account</a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Best regards,<br>
        The Salesverse Team</p>
        
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} Salesverse. All rights reserved.</p>
      </div>
    `;
  }
}
