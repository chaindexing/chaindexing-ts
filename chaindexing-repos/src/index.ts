import { ContractAddress, Event, UnsavedContractAddress } from '@chaindexing/core';
import { Migratable } from './migrations';

export abstract class Repo<Pool, Conn> extends Migratable<Conn> {
  abstract getPool(maxSize: number): Promise<Pool>;
  abstract getConn(pool: Pool): Promise<Conn>;
  abstract runInTransaction(
    conn: Conn,
    repoOps: (transaction_conn: Conn) => Promise<void>
  ): Promise<void>;
  abstract createContractAddresses(
    conn: Conn,
    contractAddresses: UnsavedContractAddress[]
  ): Promise<void>;
  abstract streamContractAddresses(
    conn: Conn,
    streamer: (contractAddresses: ContractAddress[]) => Promise<void>
  ): Promise<void>;
  abstract createEvents(conn: Conn, events: Event[]): Promise<void>;
  abstract updateLastIngestedBlockNumber(
    conn: Conn,
    contractAddresses: ContractAddress[],
    blockNumber: number
  ): Promise<void>;
}

export * from './migrations';
