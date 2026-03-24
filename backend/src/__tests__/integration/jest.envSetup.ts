/**
 * Runs in every test-worker BEFORE any module is imported.
 * Sets all env vars that config/env.ts requires so Zod validation passes.
 * MONGO_URI_TEST is injected by jest.globalSetup.ts via the parent process.
 */

process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI'] = process.env['MONGO_URI_TEST'] ?? 'mongodb://localhost:27017/test';
process.env['JWT_SECRET'] = 'integration-test-jwt-secret-at-least-32chars!!';
process.env['JWT_REFRESH_SECRET'] = 'integration-test-refresh-secret-32chars!!##';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['CLIENT_URL'] = 'http://localhost:3000';
