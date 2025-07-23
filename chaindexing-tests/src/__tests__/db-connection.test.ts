import { TestDatabase } from '../db';

describe('Database Connection Test', () => {
  test('can connect to test database', async () => {
    const pool = await TestDatabase.getPool();

    // Test basic connection
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');

    expect(result.rows[0].test).toBe(1);

    client.release();
  });

  test('can create and query tables', async () => {
    const pool = await TestDatabase.getPool();
    const client = await pool.connect();

    try {
      // Create a test table
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Insert test data
      await client.query(`
        INSERT INTO test_connection (name) VALUES ('test')
      `);

      // Query test data
      const result = await client.query(`
        SELECT name FROM test_connection WHERE name = 'test'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('test');

      // Clean up
      await client.query('DROP TABLE test_connection');
    } finally {
      client.release();
    }
  });
});
