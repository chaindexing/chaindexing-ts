import { Event, UnsavedContractAddress } from '@chaindexing/core';

// Export global test modules
export class UnsavedContractAddressFactory {
  static manyNewConflicting(size: number): UnsavedContractAddress[] {
    return this.manyNew(size).map((unsavedContractAddress) => ({
      ...unsavedContractAddress,
      chainId: 1,
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f12A'
    }));
  }
  static manyNew(size: number): UnsavedContractAddress[] {
    return manyNew(size, this.new);
  }
  static new(addressIndex = 0): UnsavedContractAddress {
    const startBlockNumber = 20;

    return {
      chainId: getRandomInteger(200),
      address: `0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f1${addressIndex}D`,
      contractName: `test-address-${addressIndex}`,
      startBlockNumber,
      nextBlockNumberToIngestFrom: startBlockNumber,
      nextBlockNumberToHandleFrom: startBlockNumber
    };
  }
}

export class EventFactory {
  static manyNew(size: number): Event[] {
    return new Array(size).fill(null).map((_, index) => this.new(index));
  }
  static new(index = 0): Event {
    return {
      contractAddress: `0xBC4CA0EdA7647A8aB7C2061c2E118A18a93${index}f${getRandomInteger(
        9
      )}${getRandomInteger(9)}D`,
      contractName: 'TestContract',
      chainId: getRandomInteger(200),
      abi: '[]',
      logParams: new Map(),
      parameters: new Map(),
      topics: new Map(),
      blockHash: '0xabcdef123456789',
      blockNumber: 123,
      transactionHash: `0x789abcdef123456$${getRandomInteger(900)}`,
      transactionIndex: 456,
      logIndex: 789,
      blockTimestamp: getRandomInteger(2000000),
      removed: false
    };
  }

  static isDeeplyEqual() {
    const excludedField = ['insertedAt'];
    return true;
  }
}

export function getRandomInteger(max: number, minimum = 0) {
  return minimum + Math.floor(Math.random() * max);
}

export function manyNew<T>(size: number, generator: (index: number) => T): T[] {
  return new Array(size).fill(null).map((_, index) => generator(index));
}
