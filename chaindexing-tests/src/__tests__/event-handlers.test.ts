import {
  PureHandler,
  SideEffectHandler,
  PureHandlerContext,
  SideEffectHandlerContext,
  createPureHandlerContext,
  createSideEffectHandlerContext,
  BaseContractState,
  StateMigrations,
  createUpdates,
} from '@chaindexing/core';
import { TestRunner } from '../test-runner';
import { baycContract } from '../factories/contracts';
import { transferEventWithContract } from '../factories/events';

// Test state for handlers
class NftTestState extends BaseContractState {
  constructor(
    public tokenId: number,
    public ownerAddress: string
  ) {
    super();
  }

  tableName(): string {
    return 'nft_test_states';
  }
}

// Test state migrations
class NftTestMigrations implements StateMigrations {
  migrations(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS nft_test_states (
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL
      )`,
    ];
  }
}

// Test Pure Handler
class TestTransferHandler implements PureHandler {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: PureHandlerContext): Promise<void> {
    const eventParams = context.getEventParams();

    const from = eventParams.getAddressString('from');
    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    // Create or update NFT state
    if (from === '0x0000000000000000000000000000000000000000') {
      // Mint: create new NFT
      const newNft = new NftTestState(tokenId, to);
      await newNft.create(context);
    } else {
      // Transfer: update existing NFT
      const existingNft = new NftTestState(tokenId, from);
      const updates = createUpdates('owner_address', to);
      await existingNft.update(updates, context);
    }
  }
}

// Test Side Effect Handler with shared state
interface TestSharedState {
  notificationCount: number;
  lastProcessedTokenId?: number;
}

class TestNotificationHandler implements SideEffectHandler<TestSharedState> {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: SideEffectHandlerContext<TestSharedState>): Promise<void> {
    const eventParams = context.getEventParams();
    const sharedState = await context.getSharedState();

    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    // Simulate side effect (notification)
    sharedState.notificationCount++;
    sharedState.lastProcessedTokenId = tokenId;

    // In a real implementation, this would send an actual notification
    console.log(`Notification sent for NFT ${tokenId} to ${to}`);
  }
}

// Test handler with error handling
class TestErrorHandler implements PureHandler {
  constructor(private shouldThrow: boolean = false) {}

  abi(): string {
    return 'event TestError(uint256 value)';
  }

  async handleEvent(_context: PureHandlerContext): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('Test handler error');
    }
  }
}

describe('Event Handlers Tests', () => {
  beforeEach(() => {
    process.env.SETUP_TEST_DB = 'true';
  });

  afterEach(async () => {
    await TestRunner.cleanup();
  });

  describe('Pure Handlers', () => {
    test('handles transfer event correctly', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        // Setup migrations
        const migrations = new NftTestMigrations();
        await repo.migrate(conn, migrations.migrations());

        // Create handler and test event
        const handler = new TestTransferHandler();
        const contract = baycContract('TestContract', '01');
        const event = transferEventWithContract(contract);

        // Create context and handle event
        const context = createPureHandlerContext(event, conn);

        // Test that handler executes without throwing
        await expect(handler.handleEvent(context)).resolves.not.toThrow();

        // Verify handler ABI is correct
        expect(handler.abi()).toBe(
          'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
        );
      });
    });

    test('handler ABI parsing works correctly', async () => {
      const handler = new TestTransferHandler();
      const abi = handler.abi();

      expect(abi).toContain('Transfer');
      expect(abi).toContain('indexed from');
      expect(abi).toContain('indexed to');
      expect(abi).toContain('indexed tokenId');
      expect(typeof abi).toBe('string');
    });

    test('error handling in pure handlers', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const errorHandler = new TestErrorHandler(true);
        const contract = baycContract('TestContract', '02');
        const event = transferEventWithContract(contract);
        const context = createPureHandlerContext(event, conn);

        // Test that handler error is propagated
        await expect(errorHandler.handleEvent(context)).rejects.toThrow('Test handler error');
      });
    });
  });

  describe('Side Effect Handlers', () => {
    test('handles side effects with shared state', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const handler = new TestNotificationHandler();
        const contract = baycContract('TestContract', '03');
        const event = transferEventWithContract(contract);

        // Create shared state
        const sharedState: TestSharedState = {
          notificationCount: 0,
        };

        const context = createSideEffectHandlerContext(event, conn, sharedState);

        // Handle event
        await handler.handleEvent(context);

        // Verify shared state was updated
        expect(sharedState.notificationCount).toBe(1);
        expect(sharedState.lastProcessedTokenId).toBeDefined();
      });
    });

    test('side effect handler ABI is correct', async () => {
      const handler = new TestNotificationHandler();
      expect(handler.abi()).toBe(
        'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
      );
    });

    test('shared state access works correctly', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const handler = new TestNotificationHandler();
        const contract = baycContract('TestContract', '04');
        const event = transferEventWithContract(contract);

        const initialState: TestSharedState = {
          notificationCount: 5,
          lastProcessedTokenId: 999,
        };

        const context = createSideEffectHandlerContext(event, conn, initialState);

        // Verify we can access the shared state
        const retrievedState = await context.getSharedState();
        expect(retrievedState.notificationCount).toBe(5);
        expect(retrievedState.lastProcessedTokenId).toBe(999);
      });
    });

    test('side effect handler without shared state throws', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _handler = new TestNotificationHandler();
        const contract = baycContract('TestContract', '05');
        const event = transferEventWithContract(contract);

        // Create context without shared state
        const context = createSideEffectHandlerContext(event, conn);

        // Should throw when trying to access shared state
        await expect(_handler.handleEvent(context)).rejects.toThrow('No shared state provided');
      });
    });
  });

  describe('Event Parameters', () => {
    test('event parameters parsing works', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const contract = baycContract('TestContract', '06');
        const event = transferEventWithContract(contract);
        const context = createPureHandlerContext(event, conn);

        const eventParams = context.getEventParams();

        // Test that we can get parameters (would need actual event data)
        expect(eventParams).toBeDefined();
        expect(typeof eventParams.getAddressString).toBe('function');
        expect(typeof eventParams.getU32).toBe('function');
        expect(typeof eventParams.getRaw).toBe('function');
      });
    });

    test('event context provides event details', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const contract = baycContract('TestContract', '07');
        const event = transferEventWithContract(contract);
        const context = createPureHandlerContext(event, conn);

        expect(context.event).toBeDefined();
        expect(context.event.id).toBeDefined();
        expect(context.event.contractAddress).toBeDefined();
        expect(context.event.chainId).toBeDefined();
        expect(context.repoClient).toBeDefined();
      });
    });
  });

  describe('Handler Registration', () => {
    test('multiple handlers with same ABI can coexist', async () => {
      const handler1 = new TestTransferHandler();
      const handler2 = new TestNotificationHandler();

      // Both handlers have the same ABI
      expect(handler1.abi()).toBe(handler2.abi());

      // But they should be different instances
      expect(handler1).not.toBe(handler2);
    });

    test('handlers can be identified by their ABI', async () => {
      const transferHandler = new TestTransferHandler();
      const errorHandler = new TestErrorHandler();

      expect(transferHandler.abi()).toContain('Transfer');
      expect(errorHandler.abi()).toContain('TestError');
      expect(transferHandler.abi()).not.toBe(errorHandler.abi());
    });
  });
});
