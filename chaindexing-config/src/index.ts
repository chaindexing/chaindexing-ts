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

  public blocks_per_batch = 20;
  public handler_rate_ms = 10000;
  public ingestion_rate_ms = 10000;

  constructor(private readonly repo: R) {}

  withBlocksPerBatch(blocks_per_batch: number): Config<Pool, Conn, R> {
    this.blocks_per_batch = blocks_per_batch;

    return this;
  }

  withHandlerIntervalMs(handler_rate_ms: number): Config<Pool, Conn, R> {
    this.handler_rate_ms = handler_rate_ms;

    return this;
  }

  withIngestionIntervalMs(ingestion_rate_ms: number): Config<Pool, Conn, R> {
    this.ingestion_rate_ms = ingestion_rate_ms;

    return this;
  }

  validate() {
    if (this.contracts.length === 0) throw new ConfigError(ConfigErrorType.NoContract);
    if (this.chains.size === 0) throw new ConfigError(ConfigErrorType.NoChain);
  }
}
