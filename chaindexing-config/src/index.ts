import { Chains, Contract } from '@chaindexing';
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

  validate() {
    if (this.contracts.length === 0) throw new ConfigError(ConfigErrorType.NoContract);
    if (this.chains.size === 0) throw new ConfigError(ConfigErrorType.NoChain);
  }
}
