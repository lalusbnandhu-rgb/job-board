import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  process.env['MONGO_URI_TEST'] = mongod.getUri();

  // Store instance reference so globalTeardown can access it
  (global as Record<string, unknown>).__MONGOD__ = mongod;
}
