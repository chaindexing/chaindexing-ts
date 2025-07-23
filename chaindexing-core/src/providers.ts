import { Chain } from './chains';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UnsavedEvent } from './events';

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
        chainId: this.chainId,
        contractAddress: log.address,
        contractName: this.getContractName(log.address, contractAddresses),
        abi: this.inferAbi(log),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseLogParameters(log: RawLog): Record<string, any> {
    const params = this.parseLogParams(log);
    const topics = this.parseTopics(log.topics);
    return { ...params, ...topics };
  }

  private parseLogParams(log: RawLog): Record<string, string> {
    // Simplified parameter parsing - real implementation would use ABI
    return {
      data: log.data,
    };
  }

  private parseTopics(topics: string[]): Record<string, string> {
    // Simplified topic parsing - real implementation would use ABI
    return topics.reduce(
      (acc, topic, index) => {
        acc[`topic${index}`] = topic;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getContractName(address: string, _contractAddresses: string[]): string {
    // Simplified contract name resolution
    return `Contract_${address.slice(0, 8)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private inferAbi(_log: RawLog): string {
    // Simplified ABI inference - real implementation would use contract metadata
    return '[]';
  }

  private inferEventName(log: RawLog): string {
    // Simplified event name inference from first topic
    if (log.topics.length > 0) {
      return `Event_${log.topics[0].slice(0, 8)}`;
    }
    return 'UnknownEvent';
  }
}

// JSON-RPC Provider implementation
export class JsonRpcProvider implements Provider {
  constructor(private rpcUrl: string) {}

  async fetchLogs(filters: LogFilter[]): Promise<RawLog[]> {
    const results: RawLog[] = [];

    for (const filter of filters) {
      const params = {
        address: filter.address,
        topics: filter.topics,
        fromBlock: `0x${filter.fromBlock.toString(16)}`,
        toBlock: `0x${filter.toBlock.toString(16)}`,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON-RPC response can be any type
      const response = (await this.jsonRpcCall('eth_getLogs', [params])) as any;

      if (response && Array.isArray(response)) {
        const logs: RawLog[] = response.map((log: any) => ({
          // eslint-disable-line @typescript-eslint/no-explicit-any -- JSON-RPC log can be any type
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: parseInt(log.blockNumber, 16),
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          transactionIndex: parseInt(log.transactionIndex, 16),
          logIndex: parseInt(log.logIndex, 16),
          removed: log.removed || false,
        }));
        results.push(...logs);
      }
    }

    return results;
  }

  async fetchBlocksByNumber(blockNumbers: number[]): Promise<Map<number, Block>> {
    const blocks = new Map<number, Block>();

    for (const blockNumber of blockNumbers) {
      const params = [`0x${blockNumber.toString(16)}`, false];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON-RPC response can be any type
      const response = (await this.jsonRpcCall('eth_getBlockByNumber', params)) as any;

      if (response) {
        blocks.set(blockNumber, {
          number: parseInt(response.number, 16),
          hash: response.hash,
          timestamp: parseInt(response.timestamp, 16),
          parentHash: response.parentHash,
        });
      }
    }

    return blocks;
  }

  async getCurrentBlockNumber(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON-RPC response can be any type
    const response = (await this.jsonRpcCall('eth_blockNumber', [])) as any;
    return parseInt(response, 16);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON-RPC parameters and response can be any type
  private async jsonRpcCall(method: string, params: any[]): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON-RPC response can be any type
    const data = (await response.json()) as any;

    if (data.error) {
      throw new Error(`JSON-RPC error: ${data.error.message}`);
    }

    return data.result;
  }
}

// Factory functions
export function createProvider(rpcUrl: string): Provider {
  return new JsonRpcProvider(rpcUrl);
}

export function createEventIngester(provider: Provider, chainId: Chain): EventIngester {
  return new EventIngesterImpl(provider, chainId);
}
