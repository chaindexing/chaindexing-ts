import { Config } from '@chaindexing/config';
import { Repo } from '@chaindexing/repos';
import { createOrchestrator, EventOrchestrator } from '@chaindexing/core';

export async function indexStates<Pool, Conn, UserRepo extends Repo<Pool, Conn>, SharedState = any>(
  config: Config<Pool, Conn, UserRepo, SharedState>
): Promise<void> {
  // Validate configuration
  config.validate();

  // Setup database and migrations
  await setup(config);

  // Create the event orchestrator
  const orchestrator = createOrchestrator<SharedState>(
    config.contracts,
    config.chains,
    config.getRepo(),
    {
      blocksPerBatch: config.blocksPerBatch,
      handlerRateMs: config.handlerRateMs,
      ingestionRateMs: config.ingestionRateMs,
      chainConcurrency: config.chainConcurrency,
      sharedState: config.sharedState
    }
  );

  // Start the indexing process
  console.log('Starting Chaindexing indexer...');
  console.log(`- Chains: ${Array.from(config.chains.keys()).join(', ')}`);
  console.log(`- Contracts: ${config.contracts.map((c) => c.name).join(', ')}`);
  console.log(`- Blocks per batch: ${config.blocksPerBatch}`);
  console.log(`- Handler rate: ${config.handlerRateMs}ms`);
  console.log(`- Ingestion rate: ${config.ingestionRateMs}ms`);

  await orchestrator.start();
}

async function setup<Pool, Conn, UserRepo extends Repo<Pool, Conn>, SharedState = any>(
  config: Config<Pool, Conn, UserRepo, SharedState>
): Promise<void> {
  console.log('Setting up Chaindexing...');

  // Get repository connection
  const repo = config.getRepo();
  const pool = await repo.getPool(10);
  const conn = await repo.getConn(pool);

  // Run internal migrations (chaindexing tables)
  console.log('Running internal migrations...');
  const internalMigrations = repo.getInternalMigrations();
  await repo.migrate(conn, internalMigrations);

  // Run user-defined state migrations
  console.log('Running state migrations...');
  const stateMigrations = getStateMigrations(config.contracts);
  for (const migration of stateMigrations) {
    const migrations = migration.migrations();
    await repo.migrate(conn, migrations);
  }

  // Create contract addresses in database
  console.log('Setting up contract addresses...');
  const allContractAddresses = config.contracts.flatMap((contract) => contract.addresses);
  if (allContractAddresses.length > 0) {
    await repo.createContractAddresses(conn, allContractAddresses);
  }

  // Execute reset queries if reset count is specified
  if (config.resetCount > 0) {
    console.log(`Executing reset (count: ${config.resetCount})...`);
    for (const resetQuery of config.resetQueries) {
      await repo.execute_raw_query(conn, resetQuery);
    }
  }

  console.log('Setup completed successfully');
}

function getStateMigrations<SharedState = any>(contracts: any[]): any[] {
  return contracts.flatMap((contract) => contract.stateMigrations || []);
}

// Export types and utilities for easier usage
export * from '@chaindexing/core';
export * from '@chaindexing/config';
export * from '@chaindexing/repos';
