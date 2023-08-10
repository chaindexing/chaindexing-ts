import { Chains, Contract } from '@chaindexing';
import { Repo } from '@chaindexing/repos';

export class Config<Pool, Conn, R extends Repo<Pool, Conn>> {
  public blocks_per_batch = 20;
  public handler_interval_ms = 10000;
  public ingestion_interval_ms = 10000;

  constructor(
    private readonly repo: R,
    private readonly chains: Chains,
    private readonly contracts: Contract[]
  ) {}

  withBlocksPerBatch(blocks_per_batch: number): Config<Pool, Conn, R> {
    this.blocks_per_batch = blocks_per_batch;

    return this;
  }

  withHandlerIntervalMs(handler_interval_ms: number): Config<Pool, Conn, R> {
    this.handler_interval_ms = handler_interval_ms;

    return this;
  }

  withIngestionIntervalMs(ingestion_interval_ms: number): Config<Pool, Conn, R> {
    this.ingestion_interval_ms = ingestion_interval_ms;

    return this;
  }
}
