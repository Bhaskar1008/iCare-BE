import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';
import { kafkaService } from './kafka.service.js';
import { logger } from '../utils/logger.js';

class NotificationService {
  async sendNotification({ type, recipient, template, context }) {
    try {
      switch (type) {
        case 'EMAIL':
          await emailService.sendEmail({
            to: recipient,
            template,
            context,
          });
          break;
        case 'SMS':
          await smsService.sendSMS({
            to: recipient,
            template,
            context,
          });
          break;
        default:
          throw new Error(`Invalid notification type: ${type}`);
      }

      // Publish notification event to Kafka if enabled
      await kafkaService.publishEvent('notifications', {
        type,
        recipient,
        template,
        status: 'SUCCESS',
      });

      logger.info({
        type,
        recipient,
        template,
      }, 'Notification sent successfully');
    } catch (error) {
      logger.error({
        error,
        type,
        recipient,
        template,
      }, 'Failed to send notification');
      throw error;
    }
  }

  async sendBulkNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    );

    return results.map((result, index) => ({
      notification: notifications[index],
      status: result.status,
      ...(result.status === 'rejected' && { error: result.reason.message }),
    }));
  }
}

export const notificationService = new NotificationService();