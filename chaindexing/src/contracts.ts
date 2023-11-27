export interface Contract {
  addresses: UnsavedContractAddress[];
  name: string;
}

export interface UnsavedContractAddress {
  contractName: string;
  address: string;
  chainId: number;
  startBlockNumber: number;
  lastIngestedBlockNumber: number;
}

export interface ContractAddress {
  id: number;
  chainId: number;
  startBlockNumber: number;
  address: string;
  contractName: string;
  nextBlockNumberToIngestFrom: number;
  nextBlockNumberToHandleFrom: number;
}
