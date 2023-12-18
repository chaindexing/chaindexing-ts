export interface Contract {
  addresses: UnsavedContractAddress[];
  name: string;
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

export interface UnsavedContractAddress extends Omit<ContractAddress, 'id'> {}
