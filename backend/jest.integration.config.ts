import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.integration.test.ts'],
  globalSetup: '<rootDir>/src/__tests__/integration/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/integration/jest.globalTeardown.ts',
  setupFiles: ['<rootDir>/src/__tests__/integration/jest.envSetup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/jest.setupAfterEnv.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30_000,
  clearMocks: true,
  resetModules: false, // must stay false — globalSetup sets env vars module-wide
};

export default config;
