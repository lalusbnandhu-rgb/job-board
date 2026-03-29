/**
 * Runs in every unit-test worker BEFORE any module is imported.
 * Sets all env vars that config/env.ts requires so Zod validation passes.
 */
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'unit-test-jwt-secret-at-least-32chars!!';
process.env['JWT_REFRESH_SECRET'] = 'unit-test-refresh-secret-32chars!!##';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['MONGODB_URI'] = 'mongodb://localhost:27017/test';
process.env['CLIENT_URL'] = 'http://localhost:3000';
