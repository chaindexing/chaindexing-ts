abstract class ExecutesRawQuery<Conn> {
  abstract execute_raw_query(conn: Conn, query: string): Promise<void>;
}

export abstract class Migratable<Conn> extends ExecutesRawQuery<Conn> {
  async migrate(conn: Conn, migrations: string[]) {
    for (const migration of migrations) {
      await this.execute_raw_query(conn, migration);
    }
  }
}

export abstract class RepoMigrations {
  abstract create_contract_addresses_migration(): string[];
  abstract drop_contract_addresses_migration(): string[];
  abstract create_events_migration(): string[];
  abstract drop_events_migration(): string[];
  getInternalMigrations(): string[] {
    return [this.create_contract_addresses_migration(), this.create_events_migration()].flat();
  }
}

export class SQLikeMigrations {
  static create_contract_addresses() {
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

  static drop_contract_addresses() {
    return [`DROP TABLE IF EXISTS chaindexing_contract_addresses`];
  }

  static create_events() {
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

  static drop_events() {
    return [`DROP TABLE IF EXISTS chaindexing_events`];
  }
}
