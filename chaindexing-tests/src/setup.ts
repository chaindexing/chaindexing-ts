import { TestDatabase } from './db';
import { config } from 'dotenv';

// Load environment variables from .env.test file
config({ path: '.env.test' });

// Only setup database for integration tests, not unit tests
const isUnitTest = process.argv.some((arg) => arg.includes('unit.test.ts'));

if (!isUnitTest && process.env.SETUP_TEST_DB !== 'false') {
  // Global test setup for integration tests
  beforeAll(async () => {
    await TestDatabase.setup();
  });

  // Global test cleanup for integration tests
  afterAll(async () => {
    await TestDatabase.cleanup();
  });
}

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
// Use the TEST_DATABASE_URL from .env.test if available, otherwise fallback to default
if (!process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/chaindexing_test';
}
