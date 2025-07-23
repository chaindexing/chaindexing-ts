import { Event, UnsavedEvent, Chain, Contract } from '@chaindexing/core';
import { getRandomInteger } from './contracts';
import { BAYC_CONTRACT_ADDRESS } from './contracts';

export class EventFactory {
  static manyNew(size: number): UnsavedEvent[] {
    return new Array(size).fill(null).map((_, index) => this.new(index));
  }

  static new(index = 0): UnsavedEvent {
    return {
      contractAddress: `0xBC4CA0EdA7647A8aB7C2061c2E118A18a93${index}f${getRandomInteger(9)}${getRandomInteger(9)}D`,
      contractName: 'TestContract',
      chainId: getRandomInteger(200),
      abi: 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      logParams: {
        data: '0x',
        topics: 'topic1,topic2',
      },
      parameters: {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        tokenId: index.toString(),
      },
      topics: {
        topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        topic1: '0x000000000000000000000000b518b3136e491101f22b77f385fe22269c515188',
      },
      blockHash: '0xabcdef123456789',
      blockNumber: 123 + index,
      transactionHash: `0x789abcdef123456${getRandomInteger(900)}`,
      transactionIndex: 456,
      logIndex: 789 + index,
      blockTimestamp: Date.now() - getRandomInteger(2000000),
      removed: false,
    };
  }
}

export function transferEventWithContract(contract: Contract<any>): Event {
  const contractAddress = BAYC_CONTRACT_ADDRESS;

  return {
    id: `event-${Date.now()}-${Math.random()}`,
    contractAddress: contractAddress.toLowerCase(),
    contractName: contract.name,
    chainId: Chain.Mainnet,
    abi: 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    logParams: {
      data: '0x',
      topics: 'topic1,topic2,topic3',
    },
    parameters: {
      from: '0x000000000000000000000000b518b3136e491101f22b77f385fe22269c515188',
      to: '0x0000000000000000000000007dfd6013cf8d92b751e63d481b51fe0e4c5abf5e',
      tokenId: '1645',
    },
    topics: {
      topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      topic1: '0x000000000000000000000000b518b3136e491101f22b77f385fe22269c515188',
      topic2: '0x0000000000000000000000007dfd6013cf8d92b751e63d481b51fe0e4c5abf5e',
      topic3: '0x000000000000000000000000000000000000000000000000000000000000067d',
    },
    blockHash: '0x8fd4ca304a2e81854059bc3e42f32064cca8b6b453f6286f95060edc6382c6f8',
    blockNumber: 18115958,
    transactionHash: '0x83d751998ff98cd609bc9b18bb36bdef8659cde2f74d6d7a1b0fef2c2bf8f839',
    transactionIndex: 89,
    logIndex: 245,
    blockTimestamp: 1697123456,
    removed: false,
    insertedAt: new Date(),
  };
}
