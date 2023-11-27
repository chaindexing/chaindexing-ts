import {
  boolean,
  date,
  integer,
  json,
  pgTable,
  serial,
  text,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

export const chaindexingContractAddressesSchema = pgTable(
  'chaindexing_contract_addresses',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id'),
    address: text('address'),
    contractName: text('contract_name'),
    nextBlockNumberToIngestFrom: integer('next_block_number_to_ingest_from'),
    nextBlockNumberToHandleFrom: integer('next_block_number_to_handler_from')
  },
  (chaindexingContractAddress) => ({
    chaindexingContractAddressesChainAddressIndex: uniqueIndex(
      'chaindexing_contract_addresses_chain_address_index'
    ).on(chaindexingContractAddress.chainId, chaindexingContractAddress.address)
  })
);

export const chaindexingEvents = pgTable('chaindexing_events', {
  id: uuid('id').primaryKey(),
  contractAddress: text('contract_address'),
  contractName: text('contract_name'),
  abi: text('abi'),
  logParams: json('log_params'),
  parameters: json('parameters'),
  topics: json('topics'),
  blockHash: json('block_hash'),
  blockNumber: integer('block_number'),
  transactionHash: json('transaction_hash'),
  transactionIndex: integer('transaction_index'),
  logIndex: integer('log_index'),
  removed: boolean('removed'),
  insertedAt: date('removed')
});
