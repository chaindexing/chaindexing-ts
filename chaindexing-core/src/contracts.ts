import { Chain } from './chains';
import { EventAbi, PureHandler, SideEffectHandler } from './handlers';

export interface Contract<SharedState = any> {
  addresses: UnsavedContractAddress[];
  name: string;
  pureHandlers: Map<EventAbi, PureHandler>;
  sideEffectHandlers: Map<EventAbi, SideEffectHandler<SharedState>>;
  stateMigrations: StateMigrations[];
}

export interface ContractAddress {
  id: number;
  chainId: number;
  startBlockNumber: number;
  address: string;
  contractName: string;
  nextBlockNumberToIngestFrom: number;
  nextBlockNumberToHandleFrom: number;
  nextBlockNumberForSideEffects: number;
}

export interface UnsavedContractAddress extends Omit<ContractAddress, 'id'> {}

// State migrations interface matching the Rust version
export interface StateMigrations {
  migrations(): string[];
}

// Contract builder class matching the Rust implementation pattern
export class ContractBuilder<SharedState = any> {
  private contract: Contract<SharedState>;

  constructor(name: string) {
    this.contract = {
      addresses: [],
      name,
      pureHandlers: new Map(),
      sideEffectHandlers: new Map(),
      stateMigrations: [],
    };
  }

  // Add a contract address to this contract
  addAddress(
    address: string,
    chainId: Chain,
    startBlockNumber: number
  ): ContractBuilder<SharedState> {
    this.contract.addresses.push({
      chainId,
      startBlockNumber,
      address,
      contractName: this.contract.name,
      nextBlockNumberToIngestFrom: startBlockNumber,
      nextBlockNumberToHandleFrom: startBlockNumber,
      nextBlockNumberForSideEffects: startBlockNumber,
    });
    return this;
  }

  // Add an event handler for deterministic state indexing
  addEventHandler(handler: PureHandler): ContractBuilder<SharedState> {
    this.contract.pureHandlers.set(handler.abi(), handler);
    return this;
  }

  // Add a side effect handler for non-deterministic operations
  addSideEffectHandler(handler: SideEffectHandler<SharedState>): ContractBuilder<SharedState> {
    this.contract.sideEffectHandlers.set(handler.abi(), handler);
    return this;
  }

  // Add state migrations for the contract states being indexed
  addStateMigrations(stateMigration: StateMigrations): ContractBuilder<SharedState> {
    this.contract.stateMigrations.push(stateMigration);
    return this;
  }

  // Build the final contract
  build(): Contract<SharedState> {
    return this.contract;
  }

  // Get all event ABIs for this contract
  getEventAbis(): EventAbi[] {
    const abis = new Set<EventAbi>();
    this.contract.pureHandlers.forEach((_, abi) => abis.add(abi));
    this.contract.sideEffectHandlers.forEach((_, abi) => abis.add(abi));
    return Array.from(abis);
  }
}

// Helper function to create a new contract
export function createContract<SharedState = any>(name: string): ContractBuilder<SharedState> {
  return new ContractBuilder<SharedState>(name);
}
