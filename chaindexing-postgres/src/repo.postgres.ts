import { ContractAddress, UnsavedContractAddress } from '@chaindexing';
import { Repo } from '@chaindexing/repos';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { chaindexingContractAddressesSchema, pool } from './drizzle';

type Conn = NodePgDatabase<Record<string, never>>;

export class PostgresRepo extends Repo<Pool, Conn> {
  pool: Pool;
  conn?: Conn;

  constructor(url: string) {
    super(url);
    this.pool = pool;
  }

  async getPool() {
    return Promise.resolve(this.pool);
  }

  async getConn() {
    return drizzle(this.pool);
  }

  async runInTransaction(conn: Conn, repo_ops: any) {
    await conn.transaction(repo_ops);
  }

  async createContractAddresses(conn: Conn, contractAddresses: UnsavedContractAddress[]) {
    const values = contractAddresses.map((address) => ({
      address: address.address,
      lastIngestedBlockNumber: address.lastIngestedBlockNumber,
      startBlockNumber: address.startBlockNumber,
      contractName: address.contractName
    }));

    await conn.insert(chaindexingContractAddressesSchema).values(values);
  }

  async streamContractAddresses(_conn: Conn, _streamer: any) {
    // TODO: Implement
    return Promise.resolve();
  }

  async createEvents(_conn: Conn, _events: any) {
    // TODO: Implement
    return Promise.resolve();
  }

  async updateLastIngestedBlockNumber(
    _conn: Conn,
    _contractAddresses: ContractAddress[],
    _blockNumber: number
  ) {
    // TODO: Implement
    return Promise.resolve();
  }
}
