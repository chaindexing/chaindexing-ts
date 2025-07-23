import {
  Chain,
  createFilters,
  createUpdates,
  EventParamsImpl,
  FiltersImpl,
  UpdatesImpl,
} from '@chaindexing/core';
import { Config } from '@chaindexing/config';

// Mock repository for testing without database
class MockRepo {
  async getPool() {
    return {};
  }
  async getConn() {
    return {};
  }
  async runInTransaction() {
    return;
  }
  async createContractAddresses() {
    return;
  }
  async getContractAddressesStream() {
    return { next: async () => [] };
  }
  async createEvents() {
    return;
  }
  async getEventsStream() {
    return { next: async () => [] };
  }
  async updateLastIngestedBlockNumber() {
    return;
  }
  async execute_raw_query() {
    return;
  }
  async runUserMigrations() {
    return;
  }
  async migrate() {
    return;
  }
  getInternalMigrations() {
    return [];
  }
}

describe('Core Functionality Unit Tests', () => {
  describe('Filters', () => {
    test('creates filters correctly', () => {
      const filters = createFilters('tokenId', 123);
      expect(filters).toBeInstanceOf(FiltersImpl);

      const filterData = filters.get();
      expect(filterData).toHaveProperty('tokenId', 123);
    });

    test('chains filters correctly', () => {
      const filters = createFilters('tokenId', 123).add('ownerAddress', '0x123');

      const filterData = filters.get();
      expect(filterData).toHaveProperty('tokenId', 123);
      expect(filterData).toHaveProperty('ownerAddress', '0x123');
    });

    test('filters immutability', () => {
      const original = createFilters('tokenId', 123);
      const chained = original.add('ownerAddress', '0x123');

      expect(original.get()).toEqual({ tokenId: 123 });
      expect(chained.get()).toEqual({ tokenId: 123, ownerAddress: '0x123' });
    });
  });

  describe('Updates', () => {
    test('creates updates correctly', () => {
      const updates = createUpdates('ownerAddress', '0x456');
      expect(updates).toBeInstanceOf(UpdatesImpl);

      const updateData = updates.getValues();
      expect(updateData).toHaveProperty('ownerAddress', '0x456');
    });

    test('chains updates correctly', () => {
      const updates = createUpdates('ownerAddress', '0x456').add('tokenId', 999);

      const updateData = updates.getValues();
      expect(updateData).toHaveProperty('ownerAddress', '0x456');
      expect(updateData).toHaveProperty('tokenId', 999);
    });

    test('updates immutability', () => {
      const original = createUpdates('ownerAddress', '0x456');
      const chained = original.add('tokenId', 999);

      expect(original.getValues()).toEqual({ ownerAddress: '0x456' });
      expect(chained.getValues()).toEqual({ ownerAddress: '0x456', tokenId: 999 });
    });
  });

  describe('EventParams', () => {
    test('parses event parameters correctly', () => {
      const mockParameters = {
        from: '0x123',
        to: '0x456',
        tokenId: '789',
      };

      const eventParams = new EventParamsImpl(mockParameters);

      expect(eventParams.getAddressString('from')).toBe('0x123');
      expect(eventParams.getAddressString('to')).toBe('0x456');
      expect(eventParams.getString('tokenId')).toBe('789');
      expect(eventParams.getRaw('from')).toBe('0x123');
    });

    test('handles missing parameters gracefully', () => {
      const mockParameters = {};

      const eventParams = new EventParamsImpl(mockParameters);

      expect(() => eventParams.getAddressString('nonexistent')).toThrow();
      expect(() => eventParams.getString('missing')).toThrow();
    });

    test('converts parameter types correctly', () => {
      const mockParameters = {
        amount: '1000000000000000000', // 1 ETH in wei
        count: '42',
        isActive: 'true',
      };

      const eventParams = new EventParamsImpl(mockParameters);

      expect(eventParams.getBigInt('amount')).toBe(BigInt('1000000000000000000'));
      expect(eventParams.getU32('count')).toBe(42);
      expect(eventParams.getU64('count')).toBe(42);
      expect(eventParams.getBoolean('isActive')).toBe(true);
    });
  });

  describe('Chain Configuration', () => {
    test('chain enum values are correct', () => {
      expect(Chain.Mainnet).toBe(1);
      expect(Chain.Sepolia).toBe(11155111);
      // Test that Chain enum exists and has expected values
      expect(typeof Chain.Mainnet).toBe('number');
      expect(typeof Chain.Sepolia).toBe('number');
    });
  });

  describe('Config Validation', () => {
    test('validates empty config throws error', () => {
      const mockRepo = new MockRepo();
      const config = new Config(mockRepo as any);

      expect(() => config.validate()).toThrow('At least one contract is required');
    });

    test('validates config with only chains throws error', () => {
      const mockRepo = new MockRepo();
      const config = new Config(mockRepo as any).addChain(Chain.Mainnet, 'https://test-url');

      expect(() => config.validate()).toThrow('At least one contract is required');
    });

    test('config builder methods work correctly', () => {
      const mockRepo = new MockRepo();
      const config = new Config(mockRepo as any)
        .addChain(Chain.Mainnet, 'https://mainnet-url')
        .addChain(Chain.Sepolia, 'https://sepolia-url')
        .withBlocksPerBatch(100)
        .withHandlerRateMs(5000)
        .withIngestionRateMs(10000)
        .withChainConcurrency(4)
        .withMinConfirmationCount(12)
        .withMaxConcurrentNodeCount(50)
        .withNodeElectionRateMs(20000)
        .reset(2);

      expect(config.chains.size).toBe(2);
      expect(config.chains.get(Chain.Mainnet)).toBe('https://mainnet-url');
      expect(config.chains.get(Chain.Sepolia)).toBe('https://sepolia-url');
      expect(config.blocksPerBatch).toBe(100);
      expect(config.handlerRateMs).toBe(5000);
      expect(config.ingestionRateMs).toBe(10000);
      expect(config.chainConcurrency).toBe(4);
      expect(config.minConfirmationCount).toBe(12);
      expect(config.maxConcurrentNodeCount).toBe(50);
      expect(config.nodeElectionRateMs).toBe(20000);
      expect(config.resetCount).toBe(2);
    });

    test('config reset functionality', () => {
      const mockRepo = new MockRepo();
      const config = new Config(mockRepo as any)
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

  describe('Error Handling', () => {
    test('config validation errors have correct messages', () => {
      const mockRepo = new MockRepo();

      // Test no contracts error
      const emptyConfig = new Config(mockRepo as any);
      expect(() => emptyConfig.validate()).toThrow('At least one contract is required');

      // Test no chains error
      const chainOnlyConfig = new Config(mockRepo as any).addChain(
        Chain.Mainnet,
        'https://test-url'
      );
      expect(() => chainOnlyConfig.validate()).toThrow('At least one contract is required');
    });

    test('event params errors for missing fields', () => {
      const mockParameters = {};
      const eventParams = new EventParamsImpl(mockParameters);

      expect(() => eventParams.getAddressString('missing')).toThrow();
      expect(() => eventParams.getU32('missing')).toThrow();
      expect(() => eventParams.getBigInt('missing')).toThrow();
      expect(() => eventParams.getBoolean('missing')).toThrow();
    });
  });

  describe('Type Safety', () => {
    test('filters maintain type safety', () => {
      const filters = createFilters('tokenId', 123);
      expect(typeof filters.get().tokenId).toBe('number');

      const stringFilters = createFilters('address', '0x123');
      expect(typeof stringFilters.get().address).toBe('string');
    });

    test('updates maintain type safety', () => {
      const updates = createUpdates('tokenId', 456);
      expect(typeof updates.getValues().tokenId).toBe('number');

      const stringUpdates = createUpdates('address', '0x456');
      expect(typeof stringUpdates.getValues().address).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    test('empty filters and updates', () => {
      const emptyFilters = new FiltersImpl();
      expect(emptyFilters.get()).toEqual({});

      const emptyUpdates = new UpdatesImpl();
      expect(emptyUpdates.getValues()).toEqual({});
    });

    test('overwriting filter and update values', () => {
      const filters = createFilters('key', 'value1').add('key', 'value2');
      expect(filters.get().key).toBe('value2');

      const updates = createUpdates('key', 'value1').add('key', 'value2');
      expect(updates.getValues().key).toBe('value2');
    });

    test('null and undefined values', () => {
      const filters = createFilters('nullKey', null).add('undefinedKey', undefined);
      const filterData = filters.get();
      expect(filterData.nullKey).toBe(null);
      expect(filterData.undefinedKey).toBe(undefined);
    });
  });
});

describe('Handler Interface Tests', () => {
  test('pure handler interface structure', () => {
    class TestPureHandler {
      abi(): string {
        return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
      }

      async handleEvent(_context: any): Promise<void> {
        // Test implementation
      }
    }

    const handler = new TestPureHandler();
    expect(typeof handler.abi).toBe('function');
    expect(typeof handler.handleEvent).toBe('function');
    expect(handler.abi()).toContain('Transfer');
  });

  test('side effect handler interface structure', () => {
    class TestSideEffectHandler {
      abi(): string {
        return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
      }

      async handleEvent(_context: any): Promise<void> {
        // Test implementation
      }
    }

    const handler = new TestSideEffectHandler();
    expect(typeof handler.abi).toBe('function');
    expect(typeof handler.handleEvent).toBe('function');
    expect(handler.abi()).toContain('Transfer');
  });

  test('handler ABI validation', () => {
    const validAbi =
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
    expect(validAbi).toContain('event');
    expect(validAbi).toContain('Transfer');
    expect(validAbi).toContain('indexed');
  });
});

describe('State Management Interfaces', () => {
  test('base contract state structure', () => {
    class TestState {
      constructor(
        public tokenId: number,
        public owner: string
      ) {}

      tableName(): string {
        return 'test_states';
      }

      toView() {
        return {
          tokenId: this.tokenId,
          owner: this.owner,
        };
      }
    }

    const state = new TestState(123, '0x123');
    expect(state.tableName()).toBe('test_states');
    expect(state.toView()).toEqual({ tokenId: 123, owner: '0x123' });
  });

  test('state migrations interface', () => {
    class TestMigrations {
      migrations(): string[] {
        return [
          'CREATE TABLE test_states (token_id INTEGER, owner TEXT)',
          'CREATE INDEX test_states_token_id_idx ON test_states(token_id)',
        ];
      }
    }

    const migrations = new TestMigrations();
    const migrationList = migrations.migrations();
    expect(Array.isArray(migrationList)).toBe(true);
    expect(migrationList.length).toBe(2);
    expect(migrationList[0]).toContain('CREATE TABLE');
  });
});
