import { RepoMigrations, SQLikeMigrations } from '@chaindexing/repos';

export class PostgresRepoMigrations extends SQLikeMigrations implements RepoMigrations {}
