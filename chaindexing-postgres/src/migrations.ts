import { RepoMigrations, SQLikeMigrations } from '@chaindexing/repos';

export class PostgresRepoMigrations extends RepoMigrations {
  create_contract_addresses_migration() {
    return SQLikeMigrations.create_contract_addresses();
  }

  drop_contract_addresses_migration() {
    return SQLikeMigrations.drop_contract_addresses();
  }

  create_events_migration() {
    return SQLikeMigrations.create_events();
  }
  drop_events_migration() {
    return SQLikeMigrations.drop_events();
  }
}
