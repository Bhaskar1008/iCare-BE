import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  try {
    // Close any existing connections
    await mongoose.disconnect();

    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'jest-test-db',
      },
    });

    const uri = mongoServer.getUri();
    console.log(`MongoDB Memory Server started at ${uri}`);

    await mongoose.connect(uri);
    console.log('Connected to MongoDB Memory Server');

    // Store the server instance so we can access it in teardown
    (
      global as typeof global & { __MONGOSERVER__: MongoMemoryServer }
    ).__MONGOSERVER__ = mongoServer;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server', error);
    throw error;
  }
}
