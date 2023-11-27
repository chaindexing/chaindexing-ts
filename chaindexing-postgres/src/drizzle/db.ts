import { Pool } from 'pg';

// TODO: Get connection string from env
export const pool = new Pool({
  connectionString: 'postgres://user:password@host:port/db',
  max: 2
});
