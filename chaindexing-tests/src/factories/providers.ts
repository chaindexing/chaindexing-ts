import { Provider, RawLog, Block, LogFilter } from '@chaindexing/core';
import { getRandomInteger } from './contracts';

export class EmptyProvider implements Provider {
  async fetchLogs(filters: LogFilter[]): Promise<RawLog[]> {
    return [];
  }

  async fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>> {
    const blockMap = new Map<number, Block>();
    blockNumbers.forEach((blockNumber) => {
      blockMap.set(blockNumber, {
        number: blockNumber,
        hash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
        timestamp: Date.now(),
        parentHash: `0x${(blockNumber - 1).toString(16).padStart(64, '0')}`,
      });
    });
    return blockMap;
  }

  async getCurrentBlockNumber(): Promise<number> {
    return 0;
  }
}

export class MockProviderWithLogs implements Provider {
  constructor(
    private contractAddress: string,
    private currentBlockNumber: number = 17774490
  ) {}

  async fetchLogs(filters: LogFilter[]): Promise<RawLog[]> {
    return [this.createTransferLog()];
  }

  async fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>> {
    const blockMap = new Map<number, Block>();
    blockNumbers.forEach((blockNumber) => {
      blockMap.set(blockNumber, {
        number: blockNumber,
        hash: `0x${blockNumber.toString(16).padStart(64, '0')}`,
        timestamp: Date.now() - (this.currentBlockNumber - blockNumber) * 12000, // ~12 sec per block
        parentHash: `0x${(blockNumber - 1).toString(16).padStart(64, '0')}`,
      });
    });
    return blockMap;
  }

  async getCurrentBlockNumber(): Promise<number> {
    return this.currentBlockNumber;
  }

  private createTransferLog(): RawLog {
    const logIndex = getRandomInteger(800, 1);

    return {
      address: this.contractAddress,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
        '0x000000000000000000000000b518b3136e491101f22b77f385fe22269c515188', // from
        '0x0000000000000000000000007dfd6013cf8d92b751e63d481b51fe0e4c5abf5e', // to
        '0x000000000000000000000000000000000000000000000000000000000000067d', // tokenId
      ],
      data: '0x',
      blockNumber: 18115958,
      blockHash: '0x8fd4ca304a2e81854059bc3e42f32064cca8b6b453f6286f95060edc6382c6f8',
      transactionHash: '0x83d751998ff98cd609bc9b18bb36bdef8659cde2f74d6d7a1b0fef2c2bf8f839',
      transactionIndex: 89,
      logIndex,
      removed: false,
    };
  }
}

export class MockProviderWithFilter implements Provider {
  constructor(
    private contractAddress: string,
    private filterValidator?: (filter: LogFilter) => void
  ) {}

  async fetchLogs(filters: LogFilter[]): Promise<RawLog[]> {
    if (this.filterValidator) {
      filters.forEach(this.filterValidator);
    }
    return [];
  }

  async fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>> {
    return new Map();
  }

  async getCurrentBlockNumber(): Promise<number> {
    return 3;
  }
}

// Helper functions to create providers (similar to Rust macros)
export function createEmptyProvider(): Provider {
  return new EmptyProvider();
}

export function createProviderWithLogs(
  contractAddress: string,
  currentBlockNumber?: number
): Provider {
  return new MockProviderWithLogs(contractAddress, currentBlockNumber);
}

export function createProviderWithFilter(
  contractAddress: string,
  filterValidator: (filter: LogFilter) => void
): Provider {
  return new MockProviderWithFilter(contractAddress, filterValidator);
}
