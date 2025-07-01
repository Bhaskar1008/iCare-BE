import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { AgentService } from '@/modules/agent/agent.service';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import type { GetAgentHierarchyDto } from '@/modules/agent/dto/get-agent-hierarchy.dto';
import type { GetAgentHierarchyInfoDto } from '@/modules/agent/dto/get-agent-hierarchy-info.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import { AobApplicationModel } from '@/models/aob-application.model';
import { ApplicantOtpModel } from '@/models/applicant-otp.model';
import { EmailUtil } from '@/common/utils/email.util';

export class UtilityController extends BaseController {
  private agentService: AgentService;

  constructor() {
    super();
    this.agentService = new AgentService();
  }

  async getAgentHierarchyInfo(
    req: ValidatedRequest<GetAgentHierarchyDto>,
    res: Response,
  ) {
    try {
      const { agentId, hierarchyId, channelId } = req.validatedQuery;

      logger.debug('Getting agent hierarchy info request', {
        agentId,
        hierarchyId,
        channelId,
      });

      const result = await this.agentService.getAgentHierarchyInfo(
        agentId,
        hierarchyId,
        channelId,
      );

      const message = result.hierarchies
        ? 'Successfully retrieved agent hierarchies'
        : 'Successfully retrieved agents list';

      this.sendSuccess(res, result, message);
    } catch (error) {
      const err = error as Error;
      this.sendError(
        res,
        'Failed to get agent hierarchy information',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getAgentHierarchyWithAgents(
    req: ValidatedRequest<GetAgentHierarchyInfoDto>,
    res: Response,
  ) {
    try {
      const { agentId, channelId } = req.validatedQuery;

      logger.debug('Getting agent hierarchy with agents request', {
        agentId,
        channelId,
      });

      const result = await this.agentService.getAgentHierarchyWithAgents(
        agentId,
        channelId,
      );

      this.sendSuccess(
        res,
        result,
        'Successfully retrieved agent hierarchy with agents',
      );
    } catch (error) {
      const err = error as Error;
      this.sendError(
        res,
        'Failed to get agent hierarchy with agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { emailId, otp } = req.body;

      // Validate and convert to string
      const emailIdStr = String(emailId);
      let otpStr = '';
      if (otp) {
        otpStr = String(otp);
      }

      logger.debug('Email verification request received', {
        emailId: emailIdStr,
        hasOtp: !!otpStr,
      });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailIdStr || !emailRegex.test(emailIdStr)) {
        this.sendBadRequest(
          res,
          `Valid email address is required - ${emailIdStr}`,
        );
        return;
      }

      // Check if email exists in application
      const application = await AobApplicationModel.findOne({
        emailAddress: emailIdStr,
      });

      if (application) {
        // Email already exists
        this.sendSuccess(
          res,
          { exists: true },
          'Email already registered. Please use another email address.',
        );
        return;
      }

      // If OTP is provided, verify it
      if (otpStr) {
        logger.debug('OTP provided, verifying it', { otpStr });
        const otpRecord = await ApplicantOtpModel.find({
          emailAddress: emailIdStr,
          isUsed: false,
        })
          .sort({ createdAt: -1 })
          .limit(1);

        if (!otpRecord) {
          this.sendBadRequest(
            res,
            `No valid OTP found for this email ${emailIdStr} - ${otpStr}.`,
          );
          return;
        }

        // Check if OTP is expired (15 minutes)
        const now = new Date();
        const otpAge = now.getTime() - otpRecord[0].createdAt.getTime();
        if (otpAge > 15 * 60 * 1000) {
          await ApplicantOtpModel.deleteOne({ _id: otpRecord[0]._id });
          this.sendBadRequest(
            res,
            'OTP has expired. Please request a new one.',
          );
          return;
        }

        // Validate OTP
        if (otpRecord[0].otp !== otpStr) {
          this.sendBadRequest(res, 'Invalid OTP');
          return;
        }

        // Mark OTP as used
        await ApplicantOtpModel.updateOne(
          { _id: otpRecord[0]._id },
          { isUsed: true },
        );

        this.sendSuccess(
          res,
          { verified: true },
          'Email verified successfully',
        );
        return;
      }

      logger.debug('No OTP provided, generating and sending a new one');
      // If no OTP provided, generate and send a new one
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

      // Remove any existing OTP for this email
      await ApplicantOtpModel.deleteMany({ emailAddress: emailIdStr });
      logger.debug('OTP deleted for this email', { emailId: emailIdStr });

      // Create new OTP
      await ApplicantOtpModel.create({
        emailAddress: emailIdStr,
        otp: newOtp,
        isUsed: false,
      });

      // Send email with OTP
      try {
        await EmailUtil.sendOtpEmail(emailIdStr, newOtp);
        logger.info('OTP email sent successfully', { emailId: emailIdStr });
      } catch (emailError) {
        logger.error('Failed to send OTP email:', {
          error: emailError,
          emailId: emailIdStr,
        });
        // Continue even if email fails
      }

      this.sendSuccess(res, { otpSent: true }, `OTP sent to ${emailIdStr}`);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to process email verification:', {
        error: err.message,
        stack: err.stack,
      });
      this.sendError(
        res,
        'Failed to process email verification',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }
}
