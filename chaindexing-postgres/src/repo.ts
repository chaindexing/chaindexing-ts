import { ContractAddress, Event, UnsavedContractAddress } from '@chaindexing/core';
import { Repo } from '@chaindexing/repos';
import { sql } from 'drizzle-orm';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { chaindexingContractAddressesSchema } from './drizzle';
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

  async streamContractAddresses(
    conn: Conn,
    streamer: (contractAddresses: ContractAddress[]) => void
  ) {
    streamer(await conn.query.chaindexingContractAddressesSchema.findMany());
    // TODO: Implement serial streaming version
  }

  async streamContractAddresses_2(conn: Conn, limit = 10, allowOffset = true) {
    let currentPage = 0;
    let offset = 0;

    const getNext = async (): Promise<ContractAddress[] | null> => {
      if (allowOffset) {
        offset = limit * currentPage;
        currentPage += 1;
      }
      return conn.query.chaindexingContractAddressesSchema.findMany({ limit, offset });
    };

    return {
      next: async () => await getNext()
    };
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
