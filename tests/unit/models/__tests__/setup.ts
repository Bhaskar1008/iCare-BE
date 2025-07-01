import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const setupTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const teardownTestDB = async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
