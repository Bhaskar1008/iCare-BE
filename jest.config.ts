import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx,ts,tsx}',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  globalSetup: '<rootDir>/tests/global.setup.ts',
  globalTeardown: '<rootDir>/tests/global.teardown.ts',
  testTimeout: 60000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/index.ts',
    '!src/app.ts',
    '!src/**/*.config.{js,mjs,ts}',
    '!src/**/*.routes.ts',
  ],
  // coverageThreshold: {
  //   global: {
  //     branches: 60,
  //     functions: 60,
  //     lines: 60,
  //     statements: 60,
  //   },
  // },
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'json-summary',
    'cobertura',
    'clover',
  ],
  coverageProvider: 'v8',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/'],
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  maxWorkers: '50%',
  forceExit: true,
  detectOpenHandles: true,
};

module.exports = config;
