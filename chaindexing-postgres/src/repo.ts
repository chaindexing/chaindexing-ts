import { ContractAddress, Event, UnsavedContractAddress, UnsavedEvent } from '@chaindexing/core';
import { Repo, SQLikeMigrations } from '@chaindexing/repos';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { chaindexingContractAddressesSchema, chaindexingEventsSchema } from './drizzle';
import * as schema from './drizzle/schema';

export type Conn = NodePgDatabase<typeof schema>;

export class PostgresRepo extends Repo<Pool, Conn> {
  constructor(private readonly url: string) {
    super();
  }

  async execute_raw_query(conn: Conn, query: string) {
    await conn.execute(sql.raw(query));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(conn: Conn, query: string, params: any[] = []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (await (conn as any).client) || (conn as any);
    if (client.query) {
      return await client.query(query, params);
    }
    // Fallback to drizzle raw execution
    await conn.execute(sql.raw(query));
  }

  async getPool(maxSize: number) {
    return new Pool({
      connectionString: this.url,
      max: maxSize,
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
          chaindexingContractAddressesSchema.address,
        ],
        set: { contractName: sql`excluded."contract_name"` },
      });
  }

  getContractAddressesStream(conn: Conn, opts?: { limit?: number }) {
    let currentPage = 0;
    let offset = 0;

    const limit = opts?.limit || 10;

    return {
      next: async (): Promise<ContractAddress[]> => {
        offset = limit * currentPage;
        currentPage += 1;

        return conn.query.chaindexingContractAddressesSchema.findMany({ limit, offset });
      },
    };
  }

  async createEvents(conn: Conn, events: UnsavedEvent[]) {
    if (events.length === 0) return;

    const _events = events.map((e) => ({ ...e, id: randomUUID() }));
    await conn.insert(chaindexingEventsSchema).values(_events);
  }

  getEventsStream(conn: Conn, opts?: { limit?: number }) {
    let currentPage = 0;
    let offset = 0;

    const limit = opts?.limit || 10;

    return {
      next: async (): Promise<Event[]> => {
        offset = limit * currentPage;
        currentPage += 1;

        const result = conn.query.chaindexingEventsSchema.findMany({
          limit,
          offset,
        });
        return result;
      },
    };
  }

  async updateLastIngestedBlockNumber(
    _conn: Conn,
    _contractAddresses: ContractAddress[],
    _blockNumber: number
  ) {
    // TODO: Implement
  }

  // Implement migration methods
  create_contract_addresses_migration(): string[] {
    return SQLikeMigrations.create_contract_addresses();
  }

  drop_contract_addresses_migration(): string[] {
    return SQLikeMigrations.drop_contract_addresses();
  }

  create_events_migration(): string[] {
    return SQLikeMigrations.create_events();
  }

  drop_events_migration(): string[] {
    return SQLikeMigrations.drop_events();
  }

  async migrate(conn: Conn, migrations: string[]): Promise<void> {
    for (const migration of migrations) {
      if (migration.trim()) {
        await this.execute_raw_query(conn, migration);
      }
    }
  }

  getInternalMigrations(): string[] {
    return [...this.create_contract_addresses_migration(), ...this.create_events_migration()];
  }
}
