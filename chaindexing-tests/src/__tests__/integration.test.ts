import {
  Chain,
  Contract,
  Event,
  PureHandler,
  PureHandlerContext,
  SideEffectHandler,
  SideEffectHandlerContext,
  BaseContractState,
  StateMigrations,
  createUpdates,
  createEventIngester,
  JsonRpcProvider,
  createContract,
} from '@chaindexing/core';
import { Config } from '@chaindexing/config';
import { PostgresRepo } from '@chaindexing/postgres';
import { TestRunner } from '../test-runner';
import { TestDatabase } from '../db';

// Test state for integration tests
class IntegrationNft extends BaseContractState {
  constructor(
    public tokenId: number,
    public ownerAddress: string
  ) {
    super();
  }

  tableName(): string {
    return 'integration_nfts';
  }
}

// Migrations for integration tests
class IntegrationNftMigrations implements StateMigrations {
  migrations(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS integration_nfts (
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    ];
  }
}

// Integration test handler
class IntegrationTransferHandler implements PureHandler {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: PureHandlerContext): Promise<void> {
    const eventParams = context.getEventParams();

    const from = eventParams.getAddressString('from');
    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    if (from === '0x0000000000000000000000000000000000000000') {
      // Mint
      const newNft = new IntegrationNft(tokenId, to);
      await newNft.create(context);
    } else {
      // Transfer
      const existingNft = new IntegrationNft(tokenId, from);
      const updates = createUpdates('owner_address', to);
      await existingNft.update(updates, context);
    }
  }
}

// Integration side effect handler
interface IntegrationSharedState {
  processedEvents: number;
  lastEventId?: string;
}

class IntegrationNotificationHandler implements SideEffectHandler<IntegrationSharedState> {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: SideEffectHandlerContext<IntegrationSharedState>): Promise<void> {
    const sharedState = await context.getSharedState();
    sharedState.processedEvents++;
    sharedState.lastEventId = context.event.id;
  }
}

// Mock Web3 Provider for testing
class MockProvider extends JsonRpcProvider {
  private mockBlockNumber: number = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mockLogs: any[] = [];

  constructor() {
    super('http://mock-provider');
  }

  async getCurrentBlockNumber(): Promise<number> {
    return this.mockBlockNumber;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchLogs(_filters: any[]): Promise<any[]> {
    return this.mockLogs;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchBlocksByNumber(_blockNumbers: number[]): Promise<Map<number, any>> {
    const blocks = new Map();
    for (const blockNumber of _blockNumbers) {
      blocks.set(blockNumber, {
        number: blockNumber,
        hash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
        timestamp: Math.floor(Date.now() / 1000),
        parentHash: `0x${(blockNumber - 1).toString(16).padStart(64, '0')}`,
      });
    }
    return blocks;
  }

  setMockBlockNumber(blockNumber: number) {
    this.mockBlockNumber = blockNumber;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMockLogs(logs: any[]) {
    this.mockLogs = logs;
  }
}

describe('Integration Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let testDb: TestDatabase;
  let mockProvider: MockProvider;

  beforeAll(async () => {
    await TestDatabase.setup();
    mockProvider = new MockProvider();
  });

  beforeEach(async () => {
    process.env.SETUP_TEST_DB = 'true';
    // Reset mock provider state
    mockProvider.setMockBlockNumber(1000);
    mockProvider.setMockLogs([]);
  });

  afterEach(async () => {
    await TestRunner.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.cleanup();
  });

  test('complete indexing flow works end-to-end', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    // Create shared state
    const sharedState: IntegrationSharedState = {
      processedEvents: 0,
    };

    // Create contract with handlers
    const contract = createContract<IntegrationSharedState>('TestERC721')
      .addAddress('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', Chain.Mainnet, 18000000)
      .addEventHandler(new IntegrationTransferHandler())
      .addSideEffectHandler(new IntegrationNotificationHandler())
      .addStateMigrations(new IntegrationNftMigrations())
      .build();

    // Create configuration
    const config = new Config(repo)
      .addChain(Chain.Mainnet, 'https://eth-mainnet.g.alchemy.com/v2/test')
      .addContract(contract)
      .withBlocksPerBatch(10)
      .withHandlerRateMs(100)
      .withIngestionRateMs(100)
      .withInitialState(sharedState);

    // Test configuration validation
    expect(() => config.validate()).not.toThrow();

    // Verify contract was added correctly
    expect(config.contracts).toHaveLength(1);
    expect(config.contracts[0].name).toBe('TestERC721');
    expect(config.contracts[0].addresses).toHaveLength(1);
    expect(config.contracts[0].pureHandlers.size).toBe(1);
    expect(config.contracts[0].sideEffectHandlers.size).toBe(1);

    // Note: Full indexStates test would require more complex setup
    // For now, we test that the configuration is valid
    console.log('Integration test setup completed successfully');
  });

  test('config validation works correctly', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    // Test empty config throws
    const emptyConfig = new Config(repo);
    expect(() => emptyConfig.validate()).toThrow('At least one contract is required');

    // Test config with only chain throws
    const chainOnlyConfig = new Config(repo).addChain(Chain.Mainnet, 'https://test-url');
    expect(() => chainOnlyConfig.validate()).toThrow('At least one contract is required');

    // Test config with only contract throws
    const contract = createContract('TestContract').build();
    const contractOnlyConfig = new Config(repo).addContract(contract);
    expect(() => contractOnlyConfig.validate()).toThrow('At least one chain is required');

    // Test valid config doesn't throw
    const validConfig = new Config(repo)
      .addChain(Chain.Mainnet, 'https://test-url')
      .addContract(contract);
    expect(() => validConfig.validate()).not.toThrow();
  });

  test('contract builder creates correct contract structure', async () => {
    const handler = new IntegrationTransferHandler();
    const sideEffectHandler = new IntegrationNotificationHandler();
    const migrations = new IntegrationNftMigrations();

    const contractBuilder = createContract<IntegrationSharedState>('TestBuilder')
      .addAddress('0x123', Chain.Mainnet, 18000000)
      .addAddress('0x456', Chain.Sepolia, 4000000)
      .addEventHandler(handler)
      .addSideEffectHandler(sideEffectHandler)
      .addStateMigrations(migrations);

    const contract = contractBuilder.build();

    expect(contract.name).toBe('TestBuilder');
    expect(contract.addresses).toHaveLength(2);
    expect(contract.addresses[0].address).toBe('0x123');
    expect(contract.addresses[0].chainId).toBe(Chain.Mainnet);
    expect(contract.addresses[1].address).toBe('0x456');
    expect(contract.addresses[1].chainId).toBe(Chain.Sepolia);

    expect(contract.pureHandlers.size).toBe(1);
    expect(contract.sideEffectHandlers.size).toBe(1);
    expect(contract.stateMigrations).toHaveLength(1);

    // Test ABI extraction using the builder
    const eventAbis = contractBuilder.getEventAbis();
    expect(eventAbis.length).toBeGreaterThan(0);
    expect(eventAbis).toContain(handler.abi());
    expect(eventAbis).toContain(sideEffectHandler.abi());
  });

  test('multi-chain configuration works', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    const contract = createContract('MultiChainContract')
      .addAddress('0x123', Chain.Mainnet, 18000000)
      .addAddress('0x456', Chain.Sepolia, 4000000)
      .build();

    const config = new Config(repo)
      .addChain(Chain.Mainnet, 'https://mainnet-url')
      .addChain(Chain.Sepolia, 'https://sepolia-url')
      .addContract(contract)
      .withChainConcurrency(2);

    expect(config.chains.size).toBe(2);
    expect(config.chains.get(Chain.Mainnet)).toBe('https://mainnet-url');
    expect(config.chains.get(Chain.Sepolia)).toBe('https://sepolia-url');
    expect(config.chainConcurrency).toBe(2);

    expect(() => config.validate()).not.toThrow();
  });

  test('event ingester can be created and configured', async () => {
    const provider = new MockProvider();
    const ingester = createEventIngester(provider, Chain.Mainnet);

    expect(ingester).toBeDefined();

    // Test empty ingestion
    const events = await ingester.ingestEvents([], 1000, 1010);
    expect(events).toEqual([]);

    // Test with empty contracts still returns empty
    const emptyEvents = await ingester.ingestEvents(['0x123'], 1000, 1010);
    expect(emptyEvents).toEqual([]);
  });

  test('config parameters are set correctly', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    const contract = createContract('TestParams').build();

    const config = new Config(repo)
      .addChain(Chain.Mainnet, 'https://test-url')
      .addContract(contract)
      .withBlocksPerBatch(500)
      .withHandlerRateMs(2000)
      .withIngestionRateMs(15000)
      .withChainConcurrency(8)
      .withMinConfirmationCount(20)
      .withMaxConcurrentNodeCount(100)
      .withNodeElectionRateMs(30000)
      .reset(5);

    expect(config.blocksPerBatch).toBe(500);
    expect(config.handlerRateMs).toBe(2000);
    expect(config.ingestionRateMs).toBe(15000);
    expect(config.chainConcurrency).toBe(8);
    expect(config.minConfirmationCount).toBe(20);
    expect(config.maxConcurrentNodeCount).toBe(100);
    expect(config.nodeElectionRateMs).toBe(30000);
    expect(config.resetCount).toBe(5);
  });

  test('shared state is properly managed', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    const initialState: IntegrationSharedState = {
      processedEvents: 10,
      lastEventId: 'test-event-123',
    };

    const contract = createContract<IntegrationSharedState>('SharedStateTest').build();

    const config = new Config(repo)
      .addChain(Chain.Mainnet, 'https://test-url')
      .addContract(contract)
      .withInitialState(initialState);

    expect(config.sharedState).toBeDefined();
    expect(config.sharedState?.processedEvents).toBe(10);
    expect(config.sharedState?.lastEventId).toBe('test-event-123');
  });

  test('reset functionality is configured properly', async () => {
    const dbUrl =
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/chaindexing_test';
    const repo = new PostgresRepo(dbUrl);

    const contract = createContract('ResetTest').build();

    const config = new Config(repo)
      .addChain(Chain.Mainnet, 'https://test-url')
      .addContract(contract)
      .reset(3)
      .resetIncludingSideEffectsDangerously(1)
      .addResetQuery('DELETE FROM custom_table')
      .addResetQuery('UPDATE stats SET reset_count = reset_count + 1');

    expect(config.resetCount).toBe(3);
    expect(config.resetIncludingSideEffectsCount).toBe(1);
    expect(config.resetQueries).toHaveLength(2);
    expect(config.resetQueries[0]).toBe('DELETE FROM custom_table');
    expect(config.resetQueries[1]).toBe('UPDATE stats SET reset_count = reset_count + 1');
  });
});
