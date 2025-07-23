import { Chain, Chains, Contract, JsonRpcUrl } from '@chaindexing/core';
import { Repo } from '@chaindexing/repos';

export enum ConfigErrorType {
  NoContract,
  NoChain,
}

class ConfigError extends Error {
  constructor(type: ConfigErrorType) {
    super(ConfigError.getErrorMessage(type));
  }

  static getErrorMessage(type: ConfigErrorType): string {
    switch (type) {
      case ConfigErrorType.NoContract:
        return 'At least one contract is required';
      case ConfigErrorType.NoChain:
        return 'At least one chain is required';
    }
  }
}

export class Config<Pool, Conn, R extends Repo<Pool, Conn>, SharedState = any> {
  // eslint-disable-line @typescript-eslint/no-explicit-any -- Generic type parameter for shared state
  public chains: Chains = new Map();
  public contracts: Contract<SharedState>[] = [];

  public blocksPerBatch = 450; // Match Rust default
  public handlerRateMs = 4000; // Match Rust default
  public ingestionRateMs = 20000; // Match Rust default
  public chainConcurrency = 4; // Match Rust default
  public resetCount = 0;
  public resetIncludingSideEffectsCount = 0;
  public minConfirmationCount = 40; // Match Rust default
  public resetQueries: string[] = [];
  public sharedState?: SharedState;
  public maxConcurrentNodeCount = 50; // Match Rust default
  public nodeElectionRateMs = 60000; // Default node election rate

  constructor(private readonly repo: R) {}

  withBlocksPerBatch(blocksPerBatch: number): Config<Pool, Conn, R, SharedState> {
    this.blocksPerBatch = blocksPerBatch;
    return this;
  }

  withHandlerRateMs(handlerRateMs: number): Config<Pool, Conn, R, SharedState> {
    this.handlerRateMs = handlerRateMs;
    return this;
  }

  withIngestionRateMs(ingestionRateMs: number): Config<Pool, Conn, R, SharedState> {
    this.ingestionRateMs = ingestionRateMs;
    return this;
  }

  withChainConcurrency(chainConcurrency: number): Config<Pool, Conn, R, SharedState> {
    this.chainConcurrency = chainConcurrency;
    return this;
  }

  addChain(chain: Chain, jsonRpcUrl: JsonRpcUrl): Config<Pool, Conn, R, SharedState> {
    this.chains.set(chain, jsonRpcUrl);
    return this;
  }

  addContract(contract: Contract<SharedState>): Config<Pool, Conn, R, SharedState> {
    this.contracts.push(contract);
    return this;
  }

  withMinConfirmationCount(minConfirmationCount: number): Config<Pool, Conn, R, SharedState> {
    this.minConfirmationCount = minConfirmationCount;
    return this;
  }

  // Restarts indexing from scratch for EventHandlers. SideEffectHandlers will not run if they ran already
  reset(count: number): Config<Pool, Conn, R, SharedState> {
    this.resetCount = count;
    return this;
  }

  // Restarts indexing from scratch for all Handlers. SideEffectHandlers will RUN even if they ran already
  resetIncludingSideEffectsDangerously(count: number): Config<Pool, Conn, R, SharedState> {
    this.resetIncludingSideEffectsCount = count;
    return this;
  }

  // Add reset queries for custom cleanup
  addResetQuery(resetQuery: string): Config<Pool, Conn, R, SharedState> {
    this.resetQueries.push(resetQuery);
    return this;
  }

  // Define the initial state for side effect handlers
  withInitialState(initialState: SharedState): Config<Pool, Conn, R, SharedState> {
    this.sharedState = initialState;
    return this;
  }

  withMaxConcurrentNodeCount(maxConcurrentNodeCount: number): Config<Pool, Conn, R, SharedState> {
    this.maxConcurrentNodeCount = maxConcurrentNodeCount;
    return this;
  }

  withNodeElectionRateMs(nodeElectionRateMs: number): Config<Pool, Conn, R, SharedState> {
    this.nodeElectionRateMs = nodeElectionRateMs;
    return this;
  }

  validate(): void {
    if (this.contracts.length === 0) throw new ConfigError(ConfigErrorType.NoContract);
    if (this.chains.size === 0) throw new ConfigError(ConfigErrorType.NoChain);
  }

  getRepo(): R {
    return this.repo;
  }
}
