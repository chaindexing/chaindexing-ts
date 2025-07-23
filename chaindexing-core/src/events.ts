export interface Event {
  id: string;
  contractAddress: string;
  contractName: string;
  chainId: number;
  abi: string;
  logParams: Record<string, string>;
  parameters: Record<string, any>;
  topics: Record<string, string>;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  blockTimestamp: number;
  removed: boolean;
  insertedAt: Date;
}

export interface UnsavedEvent extends Omit<Event, 'id' | 'insertedAt'> {}

// Event parameters parser interface
export interface EventParams {
  getAddress(paramName: string): string;
  getAddressString(paramName: string): string;
  getU32(paramName: string): number;
  getU64(paramName: string): number;
  getBigInt(paramName: string): bigint;
  getString(paramName: string): string;
  getBoolean(paramName: string): boolean;
  getRaw(paramName: string): any;
}

// Implementation of EventParams
export class EventParamsImpl implements EventParams {
  constructor(private parameters: Record<string, any>) {}

  getAddress(paramName: string): string {
    const value = this.parameters[paramName];
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new Error(`Parameter ${paramName} is not a valid address`);
  }

  getAddressString(paramName: string): string {
    return this.getAddress(paramName);
  }

  getU32(paramName: string): number {
    const value = this.parameters[paramName];
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    throw new Error(`Parameter ${paramName} is not a valid u32`);
  }

  getU64(paramName: string): number {
    const value = this.parameters[paramName];
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    throw new Error(`Parameter ${paramName} is not a valid u64`);
  }

  getBigInt(paramName: string): bigint {
    const value = this.parameters[paramName];
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number') {
      return BigInt(Math.floor(value));
    }
    if (typeof value === 'string') {
      try {
        return BigInt(value);
      } catch {
        throw new Error(`Parameter ${paramName} is not a valid bigint`);
      }
    }
    throw new Error(`Parameter ${paramName} is not a valid bigint`);
  }

  getString(paramName: string): string {
    const value = this.parameters[paramName];
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
      return value.toString();
    }
    throw new Error(`Parameter ${paramName} is not a valid string`);
  }

  getBoolean(paramName: string): boolean {
    const value = this.parameters[paramName];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    throw new Error(`Parameter ${paramName} is not a valid boolean`);
  }

  getRaw(paramName: string): any {
    return this.parameters[paramName];
  }
}

// Helper function to create EventParams from an Event
export function createEventParams(event: Event): EventParams {
  return new EventParamsImpl(event.parameters);
}
