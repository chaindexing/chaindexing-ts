export interface Event {
  contract_address: string;
  contract_name: string;
  abi: string;
  log_params: Map<String, String>;
  parameters: Map<String, String>;
  topics: Map<String, String>;
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  transaction_index: number;
  log_index: number;
  removed: boolean;
}
