import { ContractAddress, Event, UnsavedContractAddress, UnsavedEvent } from '@chaindexing/core';
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
  abstract createEvents(conn: Conn, events: UnsavedEvent[]): Promise<void>;
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

  // Abstract methods from RepoMigrations that concrete repos must implement
  abstract create_contract_addresses_migration(): string[];
  abstract drop_contract_addresses_migration(): string[];
  abstract create_events_migration(): string[];
  abstract drop_events_migration(): string[];

  // Concrete implementation from RepoMigrations
  getInternalMigrations(): string[] {
    return [this.create_contract_addresses_migration(), this.create_events_migration()].flat();
  }
}

export * from './migrations';
