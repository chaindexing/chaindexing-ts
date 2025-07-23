import { Chain } from './chains';
import { Event, UnsavedEvent } from './events';

// Web3 Provider interface for fetching blockchain data
export interface Provider {
  // Fetch logs from the blockchain
  fetchLogs(filters: LogFilter[]): Promise<RawLog[]>;

  // Fetch block information by block numbers
  fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>>;

  // Get the current block number
  getCurrentBlockNumber(): Promise<number>;
}

// Log filter for fetching events
export interface LogFilter {
  address?: string;
  topics?: string[];
  fromBlock: number;
  toBlock: number;
}

// Raw log data from the blockchain
export interface RawLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}

// Block information
export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  parentHash: string;
}

// Event ingester interface
export interface EventIngester {
  // Ingest events for specified contract addresses
  ingestEvents(
    contractAddresses: string[],
    fromBlock: number,
    toBlock: number
  ): Promise<UnsavedEvent[]>;
}

// Implementation of EventIngester
export class EventIngesterImpl implements EventIngester {
  constructor(
    private provider: Provider,
    private chainId: Chain
  ) {}

  async ingestEvents(
    contractAddresses: string[],
    fromBlock: number,
    toBlock: number
  ): Promise<UnsavedEvent[]> {
    if (contractAddresses.length === 0) {
      return [];
    }

    // Create log filters for each contract address
    const filters: LogFilter[] = contractAddresses.map((address) => ({
      address,
      fromBlock,
      toBlock,
    }));

    // Fetch logs from the provider
    const rawLogs = await this.provider.fetchLogs(filters);

    if (rawLogs.length === 0) {
      return [];
    }

    // Get unique block numbers
    const blockNumbers = [...new Set(rawLogs.map((log) => log.blockNumber))];

    // Fetch block information
    const blocksByNumber = await this.provider.fetchBlocksByNumber(blockNumbers);

    // Convert raw logs to events
    const events: UnsavedEvent[] = rawLogs.map((log) => {
      const block = blocksByNumber.get(log.blockNumber);
      if (!block) {
        throw new Error(`Block ${log.blockNumber} not found`);
      }

      // Parse log data and topics into parameters
      // This is a simplified implementation - real implementation would use ABI parsing
      const parameters = this.parseLogParameters(log);

      return {
        contractAddress: log.address,
        contractName: this.getContractName(log.address, contractAddresses),
        chainId: this.chainId,
        abi: this.inferAbi(log), // This would need proper ABI inference
        logParams: this.parseLogParams(log),
        parameters,
        topics: this.parseTopics(log.topics),
        blockHash: log.blockHash,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
        blockTimestamp: block.timestamp,
        removed: log.removed,
      };
    });

    return events;
  }

  private parseLogParameters(log: RawLog): Record<string, any> {
    // This is a placeholder implementation
    // Real implementation would decode log data using ABI
    return {
      rawData: log.data,
      rawTopics: log.topics,
    };
  }

  private parseLogParams(log: RawLog): Record<string, string> {
    // This is a placeholder implementation
    return {
      data: log.data,
      topics: log.topics.join(','),
    };
  }

  private parseTopics(topics: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    topics.forEach((topic, index) => {
      result[`topic${index}`] = topic;
    });
    return result;
  }

  private getContractName(address: string, contractAddresses: string[]): string {
    // This would need to be mapped from the contract configuration
    // For now, return a placeholder
    return `Contract_${address.slice(0, 8)}`;
  }

  private inferAbi(log: RawLog): string {
    // This would need proper ABI inference based on event signatures
    // For now, return a placeholder
    return `event Unknown()`;
  }
}

// JSON-RPC Provider implementation
export class JsonRpcProvider implements Provider {
  constructor(private rpcUrl: string) {}

  async fetchLogs(filters: LogFilter[]): Promise<RawLog[]> {
    const allLogs: RawLog[] = [];

    for (const filter of filters) {
      const params = {
        address: filter.address,
        topics: filter.topics,
        fromBlock: `0x${filter.fromBlock.toString(16)}`,
        toBlock: `0x${filter.toBlock.toString(16)}`,
      };

      const response = await this.jsonRpcCall('eth_getLogs', [params]);
      const logs = response.result || [];

      const parsedLogs: RawLog[] = logs.map((log: any) => ({
        address: log.address,
        topics: log.topics || [],
        data: log.data || '0x',
        blockNumber: parseInt(log.blockNumber, 16),
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        transactionIndex: parseInt(log.transactionIndex, 16),
        logIndex: parseInt(log.logIndex, 16),
        removed: log.removed || false,
      }));

      allLogs.push(...parsedLogs);
    }

    return allLogs;
  }

  async fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>> {
    const blockMap = new Map<number, Block>();

    for (const blockNumber of blockNumbers) {
      const response = await this.jsonRpcCall('eth_getBlockByNumber', [
        `0x${blockNumber.toString(16)}`,
        false,
      ]);

      if (response.result) {
        const block = response.result;
        blockMap.set(blockNumber, {
          number: parseInt(block.number, 16),
          hash: block.hash,
          timestamp: parseInt(block.timestamp, 16),
          parentHash: block.parentHash,
        });
      }
    }

    return blockMap;
  }

  async getCurrentBlockNumber(): Promise<number> {
    const response = await this.jsonRpcCall('eth_blockNumber', []);
    return parseInt(response.result, 16);
  }

  private async jsonRpcCall(method: string, params: any[]): Promise<any> {
    // Use global fetch if available, otherwise would need to import node-fetch
    const fetchFn = globalThis.fetch || (global as any).fetch;

    if (!fetchFn) {
      throw new Error('Fetch is not available. Please use Node.js 18+ or install node-fetch');
    }

    const response = await fetchFn(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(`JSON-RPC error: ${data.error.message}`);
    }

    return data;
  }
}

// Helper function to create a provider
export function createProvider(rpcUrl: string): Provider {
  return new JsonRpcProvider(rpcUrl);
}

// Helper function to create an event ingester
export function createEventIngester(provider: Provider, chainId: Chain): EventIngester {
  return new EventIngesterImpl(provider, chainId);
}
