import { HandlerContext, PureHandlerContext } from './handlers';

// Filters for querying states
export interface Filters {
  add(field: string, value: any): Filters;
  addMut(field: string, value: any): void;
  get(): Record<string, any>;
}

// Updates for modifying states  
export interface Updates {
  add(field: string, value: any): Updates;
  addMut(field: string, value: any): void;
  getValues(): Record<string, any>;
}

// Filters implementation
export class FiltersImpl implements Filters {
  private values: Record<string, any> = {};

  constructor(field?: string, value?: any) {
    if (field && value !== undefined) {
      this.values[field] = value;
    }
  }

  add(field: string, value: any): Filters {
    const newFilters = new FiltersImpl();
    newFilters.values = { ...this.values, [field]: value };
    return newFilters;
  }

  addMut(field: string, value: any): void {
    this.values[field] = value;
  }

  get(): Record<string, any> {
    return { ...this.values };
  }
}

// Updates implementation
export class UpdatesImpl implements Updates {
  private values: Record<string, any> = {};

  constructor(field?: string, value?: any) {
    if (field && value !== undefined) {
      this.values[field] = value;
    }
  }

  add(field: string, value: any): Updates {
    const newUpdates = new UpdatesImpl();
    newUpdates.values = { ...this.values, [field]: value };
    return newUpdates;
  }

  addMut(field: string, value: any): void {
    this.values[field] = value;
  }

  getValues(): Record<string, any> {
    return { ...this.values };
  }
}

// Helper functions to create Filters and Updates
export function createFilters(field?: string, value?: any): Filters {
  return new FiltersImpl(field, value);
}

export function createUpdates(field?: string, value?: any): Updates {
  return new UpdatesImpl(field, value);
}

// Base State interface
export interface State {
  tableName(): string;
}

// Contract State - States derived from a contract
export interface ContractState extends State {
  // Create a new state entry
  create(context: PureHandlerContext): Promise<void>;
  
  // Update this state with the specified updates
  update(updates: Updates, context: PureHandlerContext): Promise<void>;
  
  // Delete this state entry
  delete(context: PureHandlerContext): Promise<void>;
}

// Chain State - States derived from different contracts within a chain
export interface ChainState extends State {
  create(context: PureHandlerContext): Promise<void>;
  update(updates: Updates, context: PureHandlerContext): Promise<void>;
  delete(context: PureHandlerContext): Promise<void>;
}

// Multi Chain State - States derived from different contracts across different chains
// Note: Indexing MultiChainStates must be Order-Agnostic
export interface MultiChainState extends State {
  create(context: PureHandlerContext): Promise<void>;
  update(updates: Updates, context: PureHandlerContext): Promise<void>;
  delete(context: PureHandlerContext): Promise<void>;
}

// Static methods for state querying - these would be implemented by concrete state classes
export interface StateReader<T extends State> {
  readOne(filters: Filters, context: HandlerContext): Promise<T | null>;
  readMany(filters: Filters, context: HandlerContext): Promise<T[]>;
}

// Abstract base class for implementing states
export abstract class BaseState implements State {
  abstract tableName(): string;
  
  // Convert this state object to a database view (key-value pairs)
  protected toView(): Record<string, any> {
    const result: Record<string, any> = {};
    const obj = this as any;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
        result[key] = obj[key];
      }
    }
    
    return result;
  }
}

// Abstract ContractState implementation
export abstract class BaseContractState extends BaseState implements ContractState {
  async create(context: PureHandlerContext): Promise<void> {
    // Implementation will depend on the repository client
    // This is a placeholder that will be implemented when repo integration is complete
    throw new Error('BaseContractState.create() not implemented - needs repo integration');
  }

  async update(updates: Updates, context: PureHandlerContext): Promise<void> {
    throw new Error('BaseContractState.update() not implemented - needs repo integration');
  }

  async delete(context: PureHandlerContext): Promise<void> {
    throw new Error('BaseContractState.delete() not implemented - needs repo integration');
  }
}

// Abstract ChainState implementation
export abstract class BaseChainState extends BaseState implements ChainState {
  async create(context: PureHandlerContext): Promise<void> {
    throw new Error('BaseChainState.create() not implemented - needs repo integration');
  }

  async update(updates: Updates, context: PureHandlerContext): Promise<void> {
    throw new Error('BaseChainState.update() not implemented - needs repo integration');
  }

  async delete(context: PureHandlerContext): Promise<void> {
    throw new Error('BaseChainState.delete() not implemented - needs repo integration');
  }
}

// Abstract MultiChainState implementation
export abstract class BaseMultiChainState extends BaseState implements MultiChainState {
  async create(context: PureHandlerContext): Promise<void> {
    throw new Error('BaseMultiChainState.create() not implemented - needs repo integration');
  }

  async update(updates: Updates, context: PureHandlerContext): Promise<void> {
    throw new Error('BaseMultiChainState.update() not implemented - needs repo integration');
  }

  async delete(context: PureHandlerContext): Promise<void> {
    throw new Error('BaseMultiChainState.delete() not implemented - needs repo integration');
  }
} 