import { ContractAddress, Event, UnsavedContractAddress } from '@chaindexing/core';
import { Migratable } from './migrations';

export interface Repo<Pool, Conn> extends Migratable<Conn> {
  getPool(maxSize: number): Promise<Pool>;
  getConn(pool: Pool): Promise<Conn>;
  runInTransaction(conn: Conn, repoOps: (transaction_conn: Conn) => Promise<void>): Promise<void>;
  createContractAddresses(conn: Conn, contractAddresses: UnsavedContractAddress[]): Promise<void>;
  streamContractAddresses(
    conn: Conn,
    streamer: (contractAddresses: ContractAddress[]) => Promise<void>
  ): Promise<void>;
  createEvents(conn: Conn, events: Event[]): Promise<void>;
  updateLastIngestedBlockNumber(
    conn: Conn,
    contractAddresses: ContractAddress[],
    blockNumber: number
  ): Promise<void>;
}

export * from './migrations';
