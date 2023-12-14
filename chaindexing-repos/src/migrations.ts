export interface Migratable<Conn> {
  migrate(conn: Conn): Promise<void>;
}

export interface RepoMigrations {
  create_contract_addresses_migration(): string[];
  drop_contract_addresses_migration(): string[];
  create_events_migration(): string[];
  drop_events_migration(): string[];
}

export class SQLikeMigrations {
  create_contract_addresses_migration() {
    return [
      `CREATE TABLE IF NOT EXISTS chaindexing_contract_addresses (
        id SERIAL PRIMARY KEY,
        address VARCHAR NOT NULL,
        contract_name VARCHAR NOT NULL,
        chain_id INTEGER NOT NULL,
        start_block_number BIGINT NOT NULL,
        next_block_number_to_ingest_from BIGINT NULL,
        next_block_number_to_handle_from BIGINT NULL
    )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS chaindexing_contract_addresses_chain_address_index
    ON chaindexing_contract_addresses(chain_id, address)`
    ];
  }

  drop_contract_addresses_migration() {
    return [`DROP TABLE IF EXISTS chaindexing_contract_addresses`];
  }

  create_events_migration() {
    return [
      `CREATE TABLE IF NOT EXISTS chaindexing_events (
        id uuid PRIMARY KEY,
        chain_id INTEGER NOT NULL,
        contract_address VARCHAR NOT NULL,
        contract_name VARCHAR NOT NULL,
        abi TEXT NOT NULL,
        log_params JSON NOT NULL,
        parameters JSON NOT NULL,
        topics JSON NOT NULL,
        block_hash VARCHAR NOT NULL,
        block_number BIGINT NOT NULL,
        block_timestamp BIGINT NOT NULL,
        transaction_hash VARCHAR NOT NULL,
        transaction_index INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        removed BOOLEAN NOT NULL,
        inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS chaindexing_events_chain_transaction_hash_log_index
      ON chaindexing_events(chain_id,transaction_hash,log_index)`,
      `CREATE INDEX IF NOT EXISTS chaindexing_events_abi
      ON chaindexing_events(abi)`
    ];
  }

  drop_events_migration() {
    return [`DROP TABLE IF EXISTS chaindexing_events`];
  }
}
