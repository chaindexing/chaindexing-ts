module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/chaindexing-tests/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
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
  setupFilesAfterEnv: ['<rootDir>/chaindexing-tests/src/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  forceExit: true,
  detectOpenHandles: true,
};
