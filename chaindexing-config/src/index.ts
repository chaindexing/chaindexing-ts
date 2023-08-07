import { Chains, Contract } from '@chaindexing';
import { Repo } from '@chaindexing/repos';

export class Config<Pool, Conn, R extends Repo<Pool, Conn>> {
  readonly chains: Chains;
  readonly repo: R;
  readonly contracts: Contract[];
  readonly blocks_per_batch: number;
  readonly handler_interval_ms: number;
  readonly ingestion_interval_ms: number;

  constructor(repo: R, chains: Chains, contracts: Contract[]) {
    this.chains = chains;
    this.repo = repo;
    this.contracts = contracts;

    this.blocks_per_batch = 20;
    this.handler_interval_ms = 10000;
    this.ingestion_interval_ms = 10000;
  }

  withBlocksPerBatch(blocks_per_batch: number): Config<Pool, Conn, R> {
    return {
      ...this,
      blocks_per_batch
    };
  }

  withHandlerIntervalMs(handler_interval_ms: number): Config<Pool, Conn, R> {
    return {
      ...this,
      handler_interval_ms
    };
  }

  withIngestionIntervalMs(ingestion_interval_ms: number): Config<Pool, Conn, R> {
    return {
      ...this,
      ingestion_interval_ms
    };
  }
}
