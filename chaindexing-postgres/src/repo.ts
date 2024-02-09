import { ContractAddress, Event, UnsavedContractAddress } from '@chaindexing/core';
import { Repo } from '@chaindexing/repos';
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

  getContractAddressesStream(conn: Conn, opts?: { limit?: number }) {
    let currentPage = 0;
    let offset = 0;

    const limit = opts?.limit || 10;

    return {
      next: async (): Promise<ContractAddress[]> => {
        offset = limit * currentPage;
        currentPage += 1;

        return conn.query.chaindexingContractAddressesSchema.findMany({ limit, offset });
      }
    };
  }

  async createEvents(conn: Conn, events: Event[]) {
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
          offset
        }) as unknown as Event[];
        return result;
      }
    };
  }

  async updateLastIngestedBlockNumber(
    _conn: Conn,
    _contractAddresses: ContractAddress[],
    _blockNumber: number
  ) {
    // TODO: Implement
  }
}
