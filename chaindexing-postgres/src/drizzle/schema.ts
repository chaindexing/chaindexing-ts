import { integer, pgTable, serial, text, uuid, json, date, boolean } from 'drizzle-orm/pg-core';

export const chaindexing_contract_addresses = pgTable('chaindexing_contract_addresses', {
  id: serial('id').primaryKey(),
  chain_id: integer('chain_id'),
  last_ingested_block_number: integer('last_ingested_block_number'),
  start_block_number: integer('start_block_number'),
  address: text('address'),
  contract_name: text('contract_name')
});

export const chaindexing_events = pgTable('chaindexing_events', {
  id: uuid('id').primaryKey(),
  contract_address: text('contract_address'),
  contract_name: text('contract_name'),
  abi: text('abi'),
  log_params: json('log_params'),
  parameters: json('parameters'),
  topics: json('topics'),
  block_hash: json('block_hash'),
  block_number: integer('block_number'),
  transaction_hash: json('transaction_hash'),
  transaction_index: integer('transaction_index'),
  log_index: integer('log_index'),
  removed: boolean('removed'),
  inserted_at: date('removed')
});
