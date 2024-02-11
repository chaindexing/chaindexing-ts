export interface Event {
  id: string;
  contractAddress: string;
  contractName: string;
  chainId: number;
  abi: string;
  logParams: Record<string, string>;
  parameters: Record<string, string>;
  topics: Record<string, string>;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  blockTimestamp: number;
  removed: boolean;
  insertedAt: Date;
}

export interface UnsavedEvent extends Omit<Event, 'id' | 'insertedAt'> {}
