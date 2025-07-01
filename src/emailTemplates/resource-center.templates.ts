import { EmailUtil } from '@/common/utils/email.util';
import logger from '@/common/utils/logger';

export class ResourceCenterEmailTemplates {
  static async sendShareableLinkEmail(
    emails: string[],
    link: string,
  ): Promise<void> {
    try {
      const subject = 'Resource Center - Shareable Link';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resource Center - Shareable Link</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border: 1px solid #e9ecef;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #007bff;
              color: #ffffff;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #0056b3;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 14px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Resource Center</h2>
          </div>
          <div class="content">
            <h3>Hello!</h3>
            <p>A shareable link has been created for you to access resources from our Resource Center.</p>
            <p>Click the button below to access the shared resources:</p>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">Click Here</a>
            </div>
            
          </div>
          <div class="footer">
            <p>This is an automated message from the Resource Center system.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      // Send email to each recipient individually
      for (const email of emails) {
        try {
          await EmailUtil.sendMail(email, undefined, subject, htmlContent);

          logger.info(
            'Resource center shareable link email sent successfully',
            {
              email,
              link,
            },
          );
        } catch (emailError) {
          logger.error(
            'Failed to send resource center shareable link email to individual recipient:',
            {
              error: emailError,
              email,
              link,
            },
          );
          // Continue with other emails even if one fails
        }
      }
    } catch (error) {
      logger.error('Failed to send resource center shareable link emails:', {
        error,
        emails,
        link,
      });
      throw error;
    }
  }
}
