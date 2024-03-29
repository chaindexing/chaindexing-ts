import { Chain, Chains, Contract, JsonRpcUrl } from '@chaindexing/core';
import { Repo } from '@chaindexing/repos';

export enum ConfigErrorType {
  NoContract,
  NoChain
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

export class Config<Pool, Conn, R extends Repo<Pool, Conn>> {
  public chains: Chains = new Map();
  public contracts: Contract[] = [];

  public blocksPerBatch = 20;
  public handlerRateMs = 10000;
  public ingestionRateMs = 10000;
  public resetCount = 0;
  public minConfirmationCount = 0;

  constructor(private readonly repo: R) {}

  withBlocksPerBatch(blocksPerBatch: number): Config<Pool, Conn, R> {
    this.blocksPerBatch = blocksPerBatch;

    return this;
  }

  withHandlerIntervalMs(handlerRateMs: number): Config<Pool, Conn, R> {
    this.handlerRateMs = handlerRateMs;

    return this;
  }

  withIngestionIntervalMs(ingestionRateMs: number): Config<Pool, Conn, R> {
    this.ingestionRateMs = ingestionRateMs;

    return this;
  }

  addChain(chain: Chain, jsonRpcUrl: JsonRpcUrl): Config<Pool, Conn, R> {
    this.chains.set(chain, jsonRpcUrl);

    return this;
  }

  addContract(contract: Contract): Config<Pool, Conn, R> {
    this.contracts.push(contract);

    return this;
  }

  withMinConfirmationCount(minConfirmationCount: number): Config<Pool, Conn, R> {
    this.minConfirmationCount = minConfirmationCount;

    return this;
  }

  reset(count: number) {
    this.resetCount = count;

    return this;
  }

  validate() {
    if (this.contracts.length === 0) throw new ConfigError(ConfigErrorType.NoContract);
    if (this.chains.size === 0) throw new ConfigError(ConfigErrorType.NoChain);
  }
}
