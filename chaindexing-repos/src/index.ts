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
  abstract getContractAddressesStream(
    conn: Conn,
    opts?: { limit?: number }
  ): {
    next: () => Promise<ContractAddress[]>;
  };
  abstract createEvents(conn: Conn, events: Event[]): Promise<void>;
  abstract getEventsStream(
    conn: Conn,
    opts?: { limit?: number }
  ): {
    next: () => Promise<Event[]>;
  };
  abstract updateLastIngestedBlockNumber(
    conn: Conn,
    contractAddresses: ContractAddress[],
    blockNumber: number
  ): Promise<void>;
}

export * from './migrations';
