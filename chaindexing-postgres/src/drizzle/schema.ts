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
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull(),
    contractName: text('contract_name').notNull(),
    startBlockNumber: integer('start_block_number').notNull(),
    nextBlockNumberToIngestFrom: integer('next_block_number_to_ingest_from').notNull(),
    nextBlockNumberToHandleFrom: integer('next_block_number_to_handle_from').notNull()
  },
  (chaindexingContractAddress) => ({
    chaindexingContractAddressesChainAddressIndex: uniqueIndex(
      'chaindexing_contract_addresses_chain_address_index'
    ).on(chaindexingContractAddress.chainId, chaindexingContractAddress.address)
  })
);

export const chaindexingEventsSchema = pgTable('chaindexing_events', {
  id: uuid('id').primaryKey(),
  contractAddress: text('contract_address').notNull(),
  contractName: text('contract_name').notNull(),
  abi: text('abi').notNull(),
  logParams: json('log_params').notNull(),
  parameters: json('parameters').notNull(),
  topics: json('topics').notNull(),
  blockHash: json('block_hash').notNull(),
  blockNumber: integer('block_number').notNull(),
  transactionHash: json('transaction_hash').notNull(),
  transactionIndex: integer('transaction_index').notNull(),
  logIndex: integer('log_index').notNull(),
  removed: boolean('removed').notNull(),
  insertedAt: date('inserted_at').notNull()
});
