import { ContractAddress, Event, UnsavedContractAddress } from '@chaindexing/core';
import { Repo } from '@chaindexing/repos';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { chaindexingContractAddressesSchema } from './drizzle';
import { sql } from 'drizzle-orm';
import { PostgresRepoMigrations } from './migrations';
import * as schema from './drizzle/schema';

export type Conn = NodePgDatabase<typeof schema>;

export class PostgresRepo implements Repo<Pool, Conn> {
  constructor(private readonly url: string) {}

  async migrate(conn: Conn): Promise<void> {
    const { create_contract_addresses_migration, create_events_migration } =
      new PostgresRepoMigrations();
    const migrations = [create_contract_addresses_migration(), create_events_migration()].flat();
    for (const migration of migrations) {
      await conn.execute(sql.raw(migration));
    }
  }

  async getPool(maxSize: number) {
    return new Pool({
      connectionString: this.url,
      max: maxSize
    });
  }

  async getConn(pool: Pool) {
    return drizzle(pool, { schema });
  }

  async runInTransaction(conn: Conn, repo_ops: (tx: Conn) => Promise<void>) {
    await conn.transaction(repo_ops);
  }

  async createContractAddresses(conn: Conn, contractAddresses: UnsavedContractAddress[]) {
    if (contractAddresses.length === 0) return;

    await conn
      .insert(chaindexingContractAddressesSchema)
      .values(contractAddresses)
      .onConflictDoUpdate({
        target: [
          chaindexingContractAddressesSchema.chainId,
          chaindexingContractAddressesSchema.address
        ],
        set: { contractName: sql`excluded."contract_name"` }
      });
  }

  async streamContractAddresses(
    conn: Conn,
    streamer: (contractAddresses: ContractAddress[]) => void
  ) {
    streamer(await conn.query.chaindexingContractAddressesSchema.findMany());
    // TODO: Implement serial streaming version
  }

  async createEvents(_conn: Conn, _events: Event[]) {
    // TODO: Implement
  }

  async updateLastIngestedBlockNumber(
    _conn: Conn,
    _contractAddresses: ContractAddress[],
    _blockNumber: number
  ) {
    // TODO: Implement
  }
}
