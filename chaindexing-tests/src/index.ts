import { UnsavedContractAddress } from '@chaindexing/core';

// Export global test modules
export class UnsavedContractAddressFactory {
  static manyNew(size: number): UnsavedContractAddress[] {
    return new Array(size).fill(null).map((_, index) => this.new(index));
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

export function getRandomInteger(max: number, minimum = 0) {
  return minimum + Math.floor(Math.random() * max);
}
