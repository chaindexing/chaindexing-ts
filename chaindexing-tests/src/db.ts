import { Pool } from 'pg';

export class TestDatabase {
  private static pool: Pool | null = null;

  static async setup(): Promise<void> {
    const dbUrl = this.getDatabaseUrl();
    const { dbName, rawUrl } = this.parseDbUrl(dbUrl);

    try {
      // Try to connect to the test database
      await this.connect(dbUrl);
    } catch (error) {
      // If connection fails, create the database
      console.log(`Creating test database: ${dbName}`);
      await this.createDatabase(dbName, rawUrl);
    }
  }

  static async getPool(): Promise<Pool> {
    if (!this.pool) {
      const dbUrl = this.getDatabaseUrl();
      this.pool = new Pool({
        connectionString: dbUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    return this.pool;
  }

  static async cleanup(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  static async truncateAllTables(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
      // Get all table names
      const result = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'chaindexing_%' OR tablename = 'nfts'
      `);

      // Truncate each table
      for (const row of result.rows) {
        const tableName = row.tablename;
        try {
          await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        } catch (error) {
          // Ignore errors for non-existent tables
          console.warn(`Could not truncate table ${tableName}:`, error);
        }
      }
    } finally {
      client.release();
    }
  }

  private static getDatabaseUrl(): string {
    return (
      process.env.TEST_DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/chaindexing_test'
    );
  }

  private static parseDbUrl(url: string): { dbName: string; rawUrl: string } {
    const parts = url.split('/');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- URL parsing is safe here
    const dbName = parts.pop()!;
    const rawUrl = parts.join('/');
    return { dbName, rawUrl };
  }

  private static async connect(url: string): Promise<void> {
    const pool = new Pool({ connectionString: url });
    try {
      const client = await pool.connect();
      client.release();
    } finally {
      await pool.end();
    }
  }

  private static async createDatabase(dbName: string, rawUrl: string): Promise<void> {
    const pool = new Pool({ connectionString: rawUrl });
    try {
      const client = await pool.connect();
      try {
        await client.query(`CREATE DATABASE "${dbName}"`);
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }
}
