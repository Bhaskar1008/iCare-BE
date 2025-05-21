import { Kafka } from 'kafkajs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class KafkaService {
  constructor() {
    if (!config.kafka.enabled) {
      logger.info('Kafka is disabled');
      return;
    }

    try {
      this.kafka = new Kafka({
        clientId: config.kafka.clientId,
        brokers: config.kafka.brokers,
      });

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
      
      this.initialize();
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Kafka service');
    }
  }

  async initialize() {
    try {
      await this.producer.connect();
      logger.info('Kafka producer connected');

      await this.consumer.connect();
      logger.info('Kafka consumer connected');

      // Subscribe to topics
      await this.subscribeToTopics();

      // Start consuming messages
      await this.startConsumer();
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Kafka connections');
    }
  }

  async subscribeToTopics() {
    try {
      await this.consumer.subscribe({
        topics: ['leads', 'policies', 'notifications'],
        fromBeginning: true,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to subscribe to Kafka topics');
    }
  }

  async startConsumer() {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = JSON.parse(message.value.toString());
            logger.info({ topic, partition, value }, 'Received Kafka message');

            // Handle different topics
            switch (topic) {
              case 'leads':
                await this.handleLeadEvent(value);
                break;
              case 'policies':
                await this.handlePolicyEvent(value);
                break;
              case 'notifications':
                await this.handleNotificationEvent(value);
                break;
              default:
                logger.warn({ topic }, 'Unknown topic');
            }
          } catch (error) {
            logger.error({ error, topic, partition }, 'Failed to process Kafka message');
          }
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start Kafka consumer');
    }
  }

  async publishEvent(topic, message) {
    if (!config.kafka.enabled) {
      logger.info({ topic }, 'Kafka is disabled, skipping event publish');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      logger.info({ topic }, 'Event published successfully');
    } catch (error) {
      logger.error({ error, topic }, 'Failed to publish event');
      throw error;
    }
  }

  async handleLeadEvent(data) {
    // Handle lead events (e.g., new lead created, lead status updated)
    logger.info({ data }, 'Processing lead event');
  }

  async handlePolicyEvent(data) {
    // Handle policy events (e.g., policy created, policy renewed)
    logger.info({ data }, 'Processing policy event');
  }

  async handleNotificationEvent(data) {
    // Handle notification events (e.g., send email, SMS)
    logger.info({ data }, 'Processing notification event');
  }

  async disconnect() {
    if (!config.kafka.enabled) return;

    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      logger.info('Kafka connections closed');
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect Kafka');
    }
  }
}

export const kafkaService = new KafkaService();