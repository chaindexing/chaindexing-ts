export interface Contract {
  addresses: UnsavedContractAddress[];
  name: string;
}

export interface UnsavedContractAddress {
  contract_name: string;
  address: string;
  chain_id: number;
  start_block_number: number;
  last_ingested_block_number: number;
}

export interface ContractAddress {
  id: number;
  chain_id: number;
  last_ingested_block_number: number;
  start_block_number: number;
  address: string;
  contract_name: string;
}
