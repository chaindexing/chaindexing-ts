import { BaseContractState } from '@chaindexing/core';

class TestNft extends BaseContractState {
  constructor(
    public tokenId: number,
    public ownerAddress: string
  ) {
    super();
  }

  tableName(): string {
    return 'test_nfts';
  }
}

describe('Debug State Properties', () => {
  test('state toView returns correct properties', () => {
    const nft = new TestNft(123, '0x123');
    const view = (nft as any).toView();

    console.log('NFT object keys:', Object.keys(nft));
    console.log('NFT properties:', Object.getOwnPropertyNames(nft));
    console.log('NFT descriptors:', Object.getOwnPropertyDescriptors(nft));
    console.log('toView result:', view);

    expect(view).toHaveProperty('tokenId', 123);
    expect(view).toHaveProperty('ownerAddress', '0x123');
  });

  test('state object properties are accessible', () => {
    const nft = new TestNft(456, '0x456');

    expect(nft.tokenId).toBe(456);
    expect(nft.ownerAddress).toBe('0x456');
    expect(nft.tableName()).toBe('test_nfts');
  });
});
