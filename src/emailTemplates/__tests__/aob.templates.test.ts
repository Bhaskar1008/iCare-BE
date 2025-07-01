import { AobEmailTemplates } from '../aob.templates';
import { EmailUtil } from '@/common/utils/email.util';
import logger from '@/common/utils/logger';

// Mock the dependencies
jest.mock('@/common/utils/email.util', () => ({
  EmailUtil: {
    sendMail: jest.fn(),
  },
}));

jest.mock('@/common/utils/logger', () => ({
  error: jest.fn(),
}));

describe('AobEmailTemplates', () => {
  let mockEmailUtil: jest.Mocked<typeof EmailUtil>;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailUtil = EmailUtil as jest.Mocked<typeof EmailUtil>;
    mockLogger = logger as jest.Mocked<typeof logger>;
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email successfully with default subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendOtpEmail(
        'test@example.com',
        '1234',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        '',
        'Your Verification OTP',
        expect.stringContaining('1234'),
      );
      expect(result).toBe(mockResult);
    });

    it('should send OTP email successfully with custom subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendOtpEmail(
        'test@example.com',
        '5678',
        'Custom OTP Subject',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        '',
        'Custom OTP Subject',
        expect.stringContaining('5678'),
      );
      expect(result).toBe(mockResult);
    });

    it('should generate correct OTP email template', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      await AobEmailTemplates.sendOtpEmail('test@example.com', '9999');

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain('9999');
      expect(htmlContent).toContain('Email Verification');
      expect(htmlContent).toContain('verify your email address');
      expect(htmlContent).toContain('valid for 15 minutes');
      expect(htmlContent).toContain('Salesverse');
      expect(htmlContent).toContain(new Date().getFullYear().toString());
    });

    it('should handle email sending error and rethrow', async () => {
      const emailError = new Error('Email service unavailable');
      mockEmailUtil.sendMail.mockRejectedValue(emailError);

      await expect(
        AobEmailTemplates.sendOtpEmail('test@example.com', '1234'),
      ).rejects.toThrow('Email service unavailable');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send OTP email:',
        {
          error: emailError,
          email: 'test@example.com',
        },
      );
    });

    it('should handle different OTP formats', async () => {
      const otpCodes = ['0000', '1111', '9999', '5432'];
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      for (const otp of otpCodes) {
        await AobEmailTemplates.sendOtpEmail('test@example.com', otp);
        const htmlContent =
          mockEmailUtil.sendMail.mock.calls[
            mockEmailUtil.sendMail.mock.calls.length - 1
          ][3];
        expect(htmlContent).toContain(otp);
      }
    });
  });

  describe('sendShareableLinkEmail', () => {
    it('should send shareable link email successfully with default subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendShareableLinkEmail(
        'test@example.com',
        'https://example.com/share',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
        'Shareable Link',
        expect.stringContaining('https://example.com/share'),
      );
      expect(result).toBe(mockResult);
    });

    it('should send shareable link email successfully with custom subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendShareableLinkEmail(
        'test@example.com',
        'https://example.com/custom',
        'Custom Link Subject',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
        'Custom Link Subject',
        expect.stringContaining('https://example.com/custom'),
      );
      expect(result).toBe(mockResult);
    });

    it('should generate correct shareable link email template', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      await AobEmailTemplates.sendShareableLinkEmail(
        'test@example.com',
        'https://test-link.com/path',
      );

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain('https://test-link.com/path');
      expect(htmlContent).toContain('Shareable Link');
      expect(htmlContent).toContain('Access Link');
      expect(htmlContent).toContain('copy and paste this link');
      expect(htmlContent).toContain('Salesverse');
      expect(htmlContent).toContain(new Date().getFullYear().toString());
    });

    it('should handle email sending error and rethrow', async () => {
      const emailError = new Error('Email service error');
      mockEmailUtil.sendMail.mockRejectedValue(emailError);

      await expect(
        AobEmailTemplates.sendShareableLinkEmail(
          'test@example.com',
          'https://example.com',
        ),
      ).rejects.toThrow('Email service error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send shareable link email:',
        {
          error: emailError,
          email: 'test@example.com',
        },
      );
    });

    it('should handle different link formats', async () => {
      const links = [
        'https://example.com',
        'http://test.com/path?param=value',
        'https://subdomain.domain.com/long/path/with/many/segments',
      ];
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      for (const link of links) {
        await AobEmailTemplates.sendShareableLinkEmail(
          'test@example.com',
          link,
        );
        const htmlContent =
          mockEmailUtil.sendMail.mock.calls[
            mockEmailUtil.sendMail.mock.calls.length - 1
          ][3];
        expect(htmlContent).toContain(link);
      }
    });
  });

  describe('sendOnboardingEmail', () => {
    it('should send onboarding email successfully with default subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'John',
        'Doe',
        'AG001',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
        'Welcome to Salesverse - Your Application is Approved!',
        expect.stringContaining('John Doe'),
      );
      expect(result).toBe(mockResult);
    });

    it('should send onboarding email successfully with custom subject', async () => {
      const mockResult = { messageId: 'test-message-id' };
      mockEmailUtil.sendMail.mockResolvedValue(mockResult);

      const result = await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'Jane',
        'Smith',
        'AG002',
        'Custom Welcome Subject',
      );

      expect(mockEmailUtil.sendMail).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
        'Custom Welcome Subject',
        expect.stringContaining('Jane Smith'),
      );
      expect(result).toBe(mockResult);
    });

    it('should generate correct onboarding email template', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'Alice',
        'Johnson',
        'AG123',
      );

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain('Dear Alice Johnson');
      expect(htmlContent).toContain('AG123');
      expect(htmlContent).toContain('Application Approved');
      expect(htmlContent).toContain('Congratulations');
      expect(htmlContent).toContain('Agent Code:');
      expect(htmlContent).toContain('Access Your Account');
      expect(htmlContent).toContain('The Salesverse Team');
      expect(htmlContent).toContain(new Date().getFullYear().toString());
    });

    it('should handle email sending error and rethrow', async () => {
      const emailError = new Error('SMTP connection failed');
      mockEmailUtil.sendMail.mockRejectedValue(emailError);

      await expect(
        AobEmailTemplates.sendOnboardingEmail(
          'test@example.com',
          'Bob',
          'Wilson',
          'AG456',
        ),
      ).rejects.toThrow('SMTP connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send onboarding email:',
        {
          error: emailError,
          email: 'test@example.com',
        },
      );
    });

    it('should handle different name formats and agent codes', async () => {
      const testCases = [
        { firstName: 'Mary', lastName: "O'Connor", agentCode: 'AG001' },
        { firstName: 'Jean-Pierre', lastName: 'Dupont', agentCode: 'AG-999' },
        { firstName: '李', lastName: '明', agentCode: 'CN001' },
        { firstName: 'José', lastName: 'García-López', agentCode: 'ES123' },
      ];

      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      for (const testCase of testCases) {
        await AobEmailTemplates.sendOnboardingEmail(
          'test@example.com',
          testCase.firstName,
          testCase.lastName,
          testCase.agentCode,
        );

        const htmlContent =
          mockEmailUtil.sendMail.mock.calls[
            mockEmailUtil.sendMail.mock.calls.length - 1
          ][3];
        expect(htmlContent).toContain(
          `Dear ${testCase.firstName} ${testCase.lastName}`,
        );
        expect(htmlContent).toContain(testCase.agentCode);
      }
    });
  });

  describe('error handling', () => {
    it('should handle non-Error objects thrown by EmailUtil', async () => {
      mockEmailUtil.sendMail.mockRejectedValue('String error');

      await expect(
        AobEmailTemplates.sendOtpEmail('test@example.com', '1234'),
      ).rejects.toBe('String error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send OTP email:',
        {
          error: 'String error',
          email: 'test@example.com',
        },
      );
    });

    it('should handle undefined errors', async () => {
      mockEmailUtil.sendMail.mockRejectedValue(undefined);

      await expect(
        AobEmailTemplates.sendShareableLinkEmail('test@example.com', 'link'),
      ).rejects.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send shareable link email:',
        {
          error: undefined,
          email: 'test@example.com',
        },
      );
    });
  });

  describe('template generation edge cases', () => {
    it('should handle empty strings in template parameters', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        '',
        '',
        '',
      );

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain('Dear  ,'); // Empty names with comma
      expect(htmlContent).toContain('<strong>Agent Code:</strong> </li>'); // Empty agent code in list item
    });

    it('should handle special characters in template parameters', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'John<script>',
        'Doe&nbsp;',
        'AG<>123',
      );

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain('John<script>');
      expect(htmlContent).toContain('Doe&nbsp;');
      expect(htmlContent).toContain('AG<>123');
    });

    it('should handle very long parameters', async () => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });

      const longName = 'A'.repeat(100);
      const longAgentCode = `AG${'1'.repeat(50)}`;

      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        longName,
        longName,
        longAgentCode,
      );

      const htmlContent = mockEmailUtil.sendMail.mock.calls[0][3];
      expect(htmlContent).toContain(longName);
      expect(htmlContent).toContain(longAgentCode);
    });
  });

  describe('static class behavior', () => {
    it('should not be instantiable', () => {
      // Since AobEmailTemplates is a regular class with static methods,
      // it can be instantiated but we don't expect it to be used that way
      const instance = new AobEmailTemplates();
      expect(instance).toBeInstanceOf(AobEmailTemplates);
    });

    it('should have all methods as static', () => {
      expect(typeof AobEmailTemplates.sendOtpEmail).toBe('function');
      expect(typeof AobEmailTemplates.sendShareableLinkEmail).toBe('function');
      expect(typeof AobEmailTemplates.sendOnboardingEmail).toBe('function');
    });
  });

  describe('template consistency', () => {
    beforeEach(() => {
      mockEmailUtil.sendMail.mockResolvedValue({ messageId: 'test' });
    });

    it('should include Salesverse branding in all templates', async () => {
      await AobEmailTemplates.sendOtpEmail('test@example.com', '1234');
      await AobEmailTemplates.sendShareableLinkEmail(
        'test@example.com',
        'link',
      );
      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'John',
        'Doe',
        'AG001',
      );

      const calls = mockEmailUtil.sendMail.mock.calls;
      calls.forEach(call => {
        const htmlContent = call[3];
        expect(htmlContent).toContain('Salesverse');
        expect(htmlContent).toContain(new Date().getFullYear().toString());
      });
    });

    it('should use consistent styling across all templates', async () => {
      await AobEmailTemplates.sendOtpEmail('test@example.com', '1234');
      await AobEmailTemplates.sendShareableLinkEmail(
        'test@example.com',
        'link',
      );
      await AobEmailTemplates.sendOnboardingEmail(
        'test@example.com',
        'John',
        'Doe',
        'AG001',
      );

      const calls = mockEmailUtil.sendMail.mock.calls;
      calls.forEach(call => {
        const htmlContent = call[3];
        expect(htmlContent).toContain('font-family: Arial, sans-serif');
        expect(htmlContent).toContain('max-width: 600px');
        expect(htmlContent).toContain('border: 1px solid #e0e0e0');
      });
    });
  });
});
