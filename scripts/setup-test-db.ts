#!/usr/bin/env ts-node

import { PostgresRepo } from '../chaindexing-postgres/src/repo';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

async function setupTestDatabase() {
  const dbUrl =
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/chaindexing_test';

  console.log('Setting up test database with URL:', dbUrl);

  const repo = new PostgresRepo(dbUrl);

  try {
    // Get connection
    const pool = await repo.getPool(1);
    const conn = await repo.getConn(pool);

    console.log('Connected to database, running migrations...');

    // Run internal migrations
    const migrations = repo.getInternalMigrations();
    console.log('Running migrations:', migrations);

    await repo.migrate(conn, migrations);

    console.log('✅ Database setup completed successfully!');

    // Close connection
    await pool.end();
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestDatabase();
