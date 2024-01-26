import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
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
  id: uuid('id').defaultRandom().primaryKey(),
  contractAddress: text('contract_address').notNull(),
  contractName: text('contract_name').notNull(),
  chainId: integer('chain_id').notNull(),
  abi: text('abi').notNull(),
  logParams: jsonb('log_params').notNull().$type<Map<string, string>>(),
  parameters: jsonb('parameters').notNull().$type<Map<string, string>>(),
  topics: jsonb('topics').notNull().$type<Map<string, string>>(),
  blockHash: text('block_hash').notNull(),
  blockNumber: integer('block_number').notNull(),
  blockTimestamp: integer('block_timestamp').notNull(),
  transactionHash: text('transaction_hash').notNull(),
  transactionIndex: integer('transaction_index').notNull(),
  logIndex: integer('log_index').notNull(),
  removed: boolean('removed').notNull(),
  insertedAt: timestamp('inserted_at', { withTimezone: true }).notNull().defaultNow()
});
