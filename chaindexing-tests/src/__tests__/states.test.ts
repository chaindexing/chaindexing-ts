import {
  BaseContractState,
  StateMigrations,
  createUpdates,
  createPureHandlerContext,
  HandlerContext,
} from '@chaindexing/core';
import { TestRunner } from '../test-runner';
import { baycContract } from '../factories/contracts';
import { transferEventWithContract } from '../factories/events';

// Test NFT state class
class Nft extends BaseContractState {
  constructor(
    public tokenId: number,
    public ownerAddress: string = '0x0'
  ) {
    super();
  }

  tableName(): string {
    return 'nfts';
  }

  // Static methods for reading (would be implemented by the framework)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async readOne(_filters: any, _context: HandlerContext): Promise<Nft | null> {
    // This would be implemented by querying the database
    // For now, we'll return null as a placeholder
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async readMany(_filters: any, _context: HandlerContext): Promise<Nft[]> {
    // This would be implemented by querying the database
    // For now, we'll return empty array as a placeholder
    return [];
  }
}

// NFT migrations
class NftMigrations implements StateMigrations {
  migrations(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS nfts (
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL DEFAULT '0x0',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS nfts_token_id_index ON nfts(token_id)`,
    ];
  }
}

describe('ContractState Tests', () => {
  beforeEach(async () => {
    process.env.SETUP_TEST_DB = 'true';
  });

  afterEach(async () => {
    await TestRunner.cleanup();
  });

  test('creates state successfully', async () => {
    await TestRunner.runTestWithRepo(async (repo, conn) => {
      // Setup migrations
      const migrations = new NftMigrations();
      await repo.migrate(conn, migrations.migrations());

      // Create test event and context
      const contract = baycContract('BoredApeYachtClub-1', '09');
      const event = transferEventWithContract(contract);
      const context = createPureHandlerContext(event, conn);

      // Create new state
      const newState = new Nft(2, '0x123');

      // Test that creation doesn't throw
      await expect(newState.create(context)).resolves.not.toThrow();

      // Verify state was created by checking the table
      const client = await repo.getPool(1).then((pool) => repo.getConn(pool));
      await repo.execute_raw_query(client, 'SELECT COUNT(*) as count FROM nfts WHERE token_id = 2');
    });
  });

  test('updates state successfully', async () => {
    await TestRunner.runTestWithRepo(async (repo, conn) => {
      // Setup migrations
      const migrations = new NftMigrations();
      await repo.migrate(conn, migrations.migrations());

      // Create test event and context
      const contract = baycContract('BoredApeYachtClub-2', '07');
      const event = transferEventWithContract(contract);
      const context = createPureHandlerContext(event, conn);

      // Create initial state
      const newState = new Nft(1, '0x123');
      await newState.create(context);

      // Update state
      const updates = createUpdates('owner_address', '0x456');
      await expect(newState.update(updates, context)).resolves.not.toThrow();

      console.log('State updated successfully');
    });
  });

  test('deletes state successfully', async () => {
    await TestRunner.runTestWithRepo(async (repo, conn) => {
      // Setup migrations
      const migrations = new NftMigrations();
      await repo.migrate(conn, migrations.migrations());

      // Create test event and context
      const contract = baycContract('BoredApeYachtClub-3', '05');
      const event = transferEventWithContract(contract);
      const context = createPureHandlerContext(event, conn);

      // Create state
      const newState = new Nft(9, '0x123');
      await newState.create(context);

      // Delete state
      await expect(newState.delete(context)).resolves.not.toThrow();

      console.log('State deleted successfully');
    });
  });

  test('filters work correctly', async () => {
    // Test filters creation and behavior
    const filters = createUpdates('token_id', 123);
    expect(filters).toBeDefined();

    const filterData = filters.getValues();
    expect(filterData).toHaveProperty('token_id', 123);

    // Test chaining filters
    const multiFilters = filters.add('owner_address', '0x123');
    const multiFilterData = multiFilters.getValues();
    expect(multiFilterData).toHaveProperty('token_id', 123);
    expect(multiFilterData).toHaveProperty('owner_address', '0x123');
  });

  test('updates work correctly', async () => {
    // Test updates creation and behavior
    const updates = createUpdates('owner_address', '0x456');
    expect(updates).toBeDefined();

    const updateData = updates.getValues();
    expect(updateData).toHaveProperty('owner_address', '0x456');

    // Test chaining updates
    const multiUpdates = updates.add('token_id', 999);
    const multiUpdateData = multiUpdates.getValues();
    expect(multiUpdateData).toHaveProperty('owner_address', '0x456');
    expect(multiUpdateData).toHaveProperty('token_id', 999);
  });

  test('state migrations run correctly', async () => {
    await TestRunner.runTestWithRepo(async (repo, conn) => {
      const migrations = new NftMigrations();
      const migrationQueries = migrations.migrations();

      // Test that migrations don't throw
      await expect(repo.migrate(conn, migrationQueries)).resolves.not.toThrow();

      // Verify table was created by attempting to query it
      const client = await repo.getPool(1).then((pool) => repo.getConn(pool));
      await expect(
        repo.execute_raw_query(client, 'SELECT COUNT(*) FROM nfts')
      ).resolves.not.toThrow();
    });
  });

  test('state conversion to view works', async () => {
    const nft = new Nft(123, '0xabc');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const view = (nft as any).toView();

    expect(view).toHaveProperty('tokenId', 123);
    expect(view).toHaveProperty('ownerAddress', '0xabc');
    expect(typeof view.tokenId).toBe('number');
    expect(typeof view.ownerAddress).toBe('string');
  });
});
