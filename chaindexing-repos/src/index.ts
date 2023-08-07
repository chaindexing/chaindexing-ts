import { ContractAddress, UnsavedContractAddress, Event } from '@chaindexing';

export abstract class Repo<Pool, Conn> {
  constructor(private readonly url: string) {
    this.url = url;
  }

  abstract getPool(): Promise<Pool>;
  abstract getConn(): Promise<Conn>;
  abstract run_in_transaction(
    conn: Conn,
    repo_ops: (transaction_conn: Conn) => Promise<void>
  ): Promise<void>;

  abstract create_contract_addresses(
    conn: Conn,
    contract_addresses: UnsavedContractAddress[]
  ): Promise<void>;
  abstract stream_contract_addresses(
    conn: Conn,
    streamer: (contract_addresses: ContractAddress[]) => Promise<void>
  ): Promise<void>;
  abstract create_events(conn: Conn, events: Event[]): Promise<void>;
  abstract update_last_ingested_block_number(
    conn: Conn,
    contract_addresses: ContractAddress[],
    block_number: number
  ): Promise<void>;
}
