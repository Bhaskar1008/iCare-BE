import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Closed Mongoose connection');
    }

    const mongoServer = (
      global as unknown as { __MONGOSERVER__: MongoMemoryServer }
    ).__MONGOSERVER__;
    if (mongoServer) {
      await mongoServer.stop();
      console.log('Stopped MongoDB Memory Server');
    }
  } catch (error) {
    console.error('Error cleaning up MongoDB Memory Server', error);
    throw error;
  }
}
