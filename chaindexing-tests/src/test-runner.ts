import { Pool } from 'pg';
import { PostgresRepo, PostgresRepoConn } from '@chaindexing/postgres';
import { TestDatabase } from './db';

export class TestRunner {
  private static repo: PostgresRepo | null = null;

  static async getPool(): Promise<Pool> {
    return TestDatabase.getPool();
  }

  static getRepo(): PostgresRepo {
    if (!this.repo) {
      const dbUrl =
        process.env.TEST_DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/chaindexing_test';
      this.repo = new PostgresRepo(dbUrl);
    }
    return this.repo;
  }

  static async runTest<T>(testFn: (conn: PostgresRepoConn) => Promise<T>): Promise<T> {
    const repo = this.getRepo();
    const pool = await repo.getPool(1);
    const conn = await repo.getConn(pool);

    try {
      // Always setup test database to ensure migrations are run
      await this.setupTestDb(repo, conn);

      // Run test in transaction that gets rolled back
      return await conn.transaction(async (txConn) => {
        return await testFn(txConn as PostgresRepoConn);
      });
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  }

  static async runTestWithRepo<T>(
    testFn: (repo: PostgresRepo, conn: PostgresRepoConn) => Promise<T>
  ): Promise<T> {
    const repo = this.getRepo();
    const pool = await repo.getPool(1);
    const conn = await repo.getConn(pool);

    try {
      // Always setup test database to ensure migrations are run
      await this.setupTestDb(repo, conn);

      // Truncate tables before test
      await TestDatabase.truncateAllTables(pool);

      // Add execute method to conn for state operations
      (conn as any).execute = async (query: string, params: any[] = []) => {
        const client = await pool.connect();
        try {
          return await client.query(query, params);
        } finally {
          client.release();
        }
      };

      return await testFn(repo, conn);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  }

  private static async setupTestDb(repo: PostgresRepo, conn: PostgresRepoConn): Promise<void> {
    // Run internal migrations
    const internalMigrations = repo.getInternalMigrations();
    await repo.migrate(conn, internalMigrations);

    console.log('Test database setup completed');
  }

  static async cleanup(): Promise<void> {
    await TestDatabase.cleanup();
    this.repo = null;
  }
}
