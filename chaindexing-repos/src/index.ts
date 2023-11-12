import { ContractAddress, UnsavedContractAddress, Event } from '@chaindexing';

export abstract class Repo<Pool, Conn> {
  constructor(private readonly url: string) {
    this.url = url;
  }

  abstract getPool(): Promise<Pool>;
  abstract getConn(): Promise<Conn>;
  abstract runInTransaction(
    conn: Conn,
    repo_ops: (transaction_conn: Conn) => Promise<void>
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
    block_number: number
  ): Promise<void>;
}
