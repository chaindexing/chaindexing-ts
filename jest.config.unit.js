module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/chaindexing-tests/src'],
  testMatch: ['**/__tests__/**/unit.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'chaindexing*/src/**/*.ts',
    '!chaindexing*/src/**/*.d.ts',
    '!chaindexing*/src/**/index.ts',
  ],
  moduleNameMapper: {
    '^@chaindexing/(.*)$': '<rootDir>/chaindexing-$1/src',
  },
  // No setup files for unit tests - they should be isolated
  testTimeout: 10000,
  maxWorkers: 4, // Can run in parallel since no database
  forceExit: true,
  detectOpenHandles: true,
};
