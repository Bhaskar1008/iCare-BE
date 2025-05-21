import { logger } from '../utils/logger.js';

class QueueService {
  constructor() {
    this.queues = new Map();
  }

  async addToQueue(queueName, job) {
    try {
      if (!this.queues.has(queueName)) {
        this.queues.set(queueName, []);
      }

      const queue = this.queues.get(queueName);
      queue.push({
        id: crypto.randomUUID(),
        data: job,
        status: 'PENDING',
        createdAt: new Date(),
      });

      logger.info({
        queueName,
        jobId: job.id,
      }, 'Job added to queue');
    } catch (error) {
      logger.error({
        error,
        queueName,
      }, 'Failed to add job to queue');
      throw error;
    }
  }

  async processQueue(queueName, processor) {
    try {
      const queue = this.queues.get(queueName) || [];
      const pendingJobs = queue.filter(job => job.status === 'PENDING');

      for (const job of pendingJobs) {
        try {
          job.status = 'PROCESSING';
          await processor(job.data);
          job.status = 'COMPLETED';
          job.completedAt = new Date();

          logger.info({
            queueName,
            jobId: job.id,
          }, 'Job processed successfully');
        } catch (error) {
          job.status = 'FAILED';
          job.error = error.message;
          job.failedAt = new Date();

          logger.error({
            error,
            queueName,
            jobId: job.id,
          }, 'Job processing failed');
        }
      }

      // Clean up completed and failed jobs older than 24 hours
      this.cleanup(queueName);
    } catch (error) {
      logger.error({
        error,
        queueName,
      }, 'Failed to process queue');
      throw error;
    }
  }

  cleanup(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredQueue = queue.filter(job => {
      const jobDate = job.completedAt || job.failedAt || job.createdAt;
      return jobDate > twentyFourHoursAgo;
    });

    this.queues.set(queueName, filteredQueue);
  }

  getQueueStats(queueName) {
    const queue = this.queues.get(queueName) || [];
    return {
      total: queue.length,
      pending: queue.filter(job => job.status === 'PENDING').length,
      processing: queue.filter(job => job.status === 'PROCESSING').length,
      completed: queue.filter(job => job.status === 'COMPLETED').length,
      failed: queue.filter(job => job.status === 'FAILED').length,
    };
  }
}

export const queueService = new QueueService();