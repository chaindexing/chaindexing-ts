import { Chain, createContract, Contract } from '@chaindexing/core';

export const BAYC_CONTRACT_ADDRESS = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
export const BAYC_CONTRACT_START_BLOCK_NUMBER = 17773490;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function baycContract<_SharedState = any>(
  name: string,
  twoDigitNonce: string
): Contract<_SharedState> {
  return createContract<_SharedState>(name)
    .addAddress(
      `0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f${twoDigitNonce}D`,
      Chain.Mainnet,
      BAYC_CONTRACT_START_BLOCK_NUMBER
    )
    .build();
}

export function getRandomInteger(max: number, minimum = 0): number {
  return minimum + Math.floor(Math.random() * max);
}

export function manyNew<T>(size: number, generator: (index: number) => T): T[] {
  return new Array(size).fill(null).map((_, index) => generator(index));
}
