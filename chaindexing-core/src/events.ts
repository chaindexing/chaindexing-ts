export interface Event {
  contractAddress: string;
  contractName: string;
  abi: string;
  logParams: Map<String, String>;
  parameters: Map<String, String>;
  topics: Map<String, String>;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}
