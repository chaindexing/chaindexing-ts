export interface Event {
  contractAddress: string;
  contractName: string;
  chainId: number;
  abi: string;
  logParams: Map<string, string>;
  parameters: Map<string, string>;
  topics: Map<string, string>;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  blockTimestamp: number;
  removed: boolean;
}

export interface SavedEvent extends Event {
  id: number;
  insertedAt: Date;
}
