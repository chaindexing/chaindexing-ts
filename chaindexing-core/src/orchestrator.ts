import { Chain } from './chains';
import { Contract, ContractAddress } from './contracts';
import { Event } from './events';
import {
  PureHandler,
  SideEffectHandler,
  createPureHandlerContext,
  createSideEffectHandlerContext
} from './handlers';
import { Provider, EventIngester, createEventIngester } from './providers';

// Node information for distributed processing
export interface Node {
  id: number;
  lastActiveAt: number;
  insertedAt: number;
}

// Node task for managing concurrent processing
export interface NodeTask {
  id: string;
  isRunning: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Event processing orchestrator
export class EventOrchestrator<SharedState = any> {
  private isRunning = false;
  private nodeTask?: NodeTask;
  private providers = new Map<Chain, Provider>();
  private ingesters = new Map<Chain, EventIngester>();

  constructor(
    private contracts: Contract<SharedState>[],
    private chains: Map<Chain, string>, // chain -> rpc url
    private repo: any, // Repository client
    private config: {
      blocksPerBatch: number;
      handlerRateMs: number;
      ingestionRateMs: number;
      chainConcurrency: number;
      sharedState?: SharedState;
    }
  ) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.chains.forEach((rpcUrl, chainId) => {
      // This would use a proper provider implementation
      const provider = this.createProvider(rpcUrl);
      const ingester = createEventIngester(provider, chainId);

      this.providers.set(chainId, provider);
      this.ingesters.set(chainId, ingester);
    });
  }

  private createProvider(rpcUrl: string): Provider {
    // This would be implemented with a proper Web3 provider
    // For now, return a placeholder
    return {
      fetchLogs: async () => [],
      fetchBlocksByNumber: async () => new Map(),
      getCurrentBlockNumber: async () => 0
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Start event ingestion for each chain
    const ingestionTasks = Array.from(this.chains.keys()).map((chainId) =>
      this.startIngestionForChain(chainId)
    );

    // Start event handling
    const handlingTask = this.startEventHandling();

    // Wait for all tasks
    await Promise.all([...ingestionTasks, handlingTask]);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.nodeTask) {
      await this.nodeTask.stop();
    }
  }

  private async startIngestionForChain(chainId: Chain): Promise<void> {
    const ingester = this.ingesters.get(chainId);
    if (!ingester) {
      throw new Error(`No ingester found for chain ${chainId}`);
    }

    while (this.isRunning) {
      try {
        // Get contract addresses for this chain
        const contractAddresses = this.getContractAddressesForChain(chainId);

        if (contractAddresses.length > 0) {
          // Determine block range to ingest
          const currentBlock = await this.getCurrentBlockNumber(chainId);
          const fromBlock = await this.getLastIngestedBlock(chainId);
          const toBlock = Math.min(fromBlock + this.config.blocksPerBatch, currentBlock);

          if (fromBlock < toBlock) {
            // Ingest events
            const events = await ingester.ingestEvents(
              contractAddresses.map((ca) => ca.address),
              fromBlock,
              toBlock
            );

            // Store events in repository
            if (events.length > 0) {
              await this.storeEvents(events);
            }

            // Update last ingested block numbers
            await this.updateLastIngestedBlocks(contractAddresses, toBlock);
          }
        }

        // Wait before next ingestion cycle
        await this.sleep(this.config.ingestionRateMs);
      } catch (error) {
        console.error(`Error in ingestion for chain ${chainId}:`, error);
        await this.sleep(this.config.ingestionRateMs);
      }
    }
  }

  private async startEventHandling(): Promise<void> {
    while (this.isRunning) {
      try {
        // Process events for each chain sequentially
        for (const chainId of this.chains.keys()) {
          await this.handleEventsForChain(chainId);
        }

        // Wait before next handling cycle
        await this.sleep(this.config.handlerRateMs);
      } catch (error) {
        console.error('Error in event handling:', error);
        await this.sleep(this.config.handlerRateMs);
      }
    }
  }

  private async handleEventsForChain(chainId: Chain): Promise<void> {
    const contractAddresses = this.getContractAddressesForChain(chainId);

    for (const contractAddress of contractAddresses) {
      // Get unprocessed events for this contract
      const events = await this.getUnprocessedEvents(contractAddress);

      for (const event of events) {
        // Handle pure events (deterministic state indexing)
        await this.handlePureEvent(event);

        // Handle side effect events
        await this.handleSideEffectEvent(event);

        // Mark event as processed
        await this.markEventAsProcessed(event, contractAddress);
      }
    }
  }

  private async handlePureEvent(event: Event): Promise<void> {
    // Find the appropriate pure handler for this event
    const handler = this.findPureHandler(event.abi);

    if (handler) {
      const context = createPureHandlerContext(event, this.repo);
      await handler.handleEvent(context);
    }
  }

  private async handleSideEffectEvent(event: Event): Promise<void> {
    // Find the appropriate side effect handler for this event
    const handler = this.findSideEffectHandler(event.abi);

    if (handler) {
      const context = createSideEffectHandlerContext(event, this.repo, this.config.sharedState);
      await handler.handleEvent(context);
    }
  }

  private findPureHandler(abi: string): PureHandler | null {
    for (const contract of this.contracts) {
      const handler = contract.pureHandlers.get(abi);
      if (handler) {
        return handler;
      }
    }
    return null;
  }

  private findSideEffectHandler(abi: string): SideEffectHandler<SharedState> | null {
    for (const contract of this.contracts) {
      const handler = contract.sideEffectHandlers.get(abi);
      if (handler) {
        return handler;
      }
    }
    return null;
  }

  private getContractAddressesForChain(chainId: Chain): ContractAddress[] {
    const addresses: ContractAddress[] = [];

    this.contracts.forEach((contract) => {
      contract.addresses.forEach((address) => {
        if (address.chainId === chainId) {
          addresses.push({
            ...address,
            id: 0 // Would be populated from database
          });
        }
      });
    });

    return addresses;
  }

  private async getCurrentBlockNumber(chainId: Chain): Promise<number> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No provider found for chain ${chainId}`);
    }
    return await provider.getCurrentBlockNumber();
  }

  private async getLastIngestedBlock(chainId: Chain): Promise<number> {
    // This would query the repository for the last ingested block
    // For now, return a placeholder
    return 0;
  }

  private async storeEvents(events: any[]): Promise<void> {
    // This would use the repository to store events
    // Implementation depends on the repository interface
    console.log(`Storing ${events.length} events`);
  }

  private async updateLastIngestedBlocks(
    contractAddresses: ContractAddress[],
    blockNumber: number
  ): Promise<void> {
    // This would update the last ingested block numbers in the repository
    console.log(
      `Updating last ingested block to ${blockNumber} for ${contractAddresses.length} contracts`
    );
  }

  private async getUnprocessedEvents(contractAddress: ContractAddress): Promise<Event[]> {
    // This would query the repository for unprocessed events
    // For now, return empty array
    return [];
  }

  private async markEventAsProcessed(
    event: Event,
    contractAddress: ContractAddress
  ): Promise<void> {
    // This would update the repository to mark the event as processed
    console.log(`Marking event ${event.id} as processed for contract ${contractAddress.address}`);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Node task implementation
export class NodeTaskImpl implements NodeTask {
  public readonly id: string;
  public isRunning = false;
  private abortController?: AbortController;

  constructor(id?: string) {
    this.id = id || `task-${Date.now()}-${Math.random()}`;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// Helper function to create an orchestrator
export function createOrchestrator<SharedState = any>(
  contracts: Contract<SharedState>[],
  chains: Map<Chain, string>,
  repo: any,
  config: {
    blocksPerBatch: number;
    handlerRateMs: number;
    ingestionRateMs: number;
    chainConcurrency: number;
    sharedState?: SharedState;
  }
): EventOrchestrator<SharedState> {
  return new EventOrchestrator(contracts, chains, repo, config);
}
