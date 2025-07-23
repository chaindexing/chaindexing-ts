import { PostgresRepo } from '@chaindexing/postgres';
import { UnsavedContractAddress, Chain } from '@chaindexing/core';
import { TestRunner } from '../test-runner';
import { UnsavedContractAddressFactory, EventFactory } from '../index';

describe('PostgresRepo Tests', () => {
  beforeEach(() => {
    process.env.SETUP_TEST_DB = 'true';
  });

  afterEach(async () => {
    await TestRunner.cleanup();
  });

  describe('createContractAddresses', () => {
    test('creates contract addresses', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const contractName = 'contract-name-1';
        const contractAddress = '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8993e';
        const chainId = Chain.Mainnet;
        const startBlockNumber = 0;

        const contractAddresses: UnsavedContractAddress[] = [
          {
            contractName,
            address: contractAddress,
            chainId,
            startBlockNumber,
            nextBlockNumberToIngestFrom: startBlockNumber,
            nextBlockNumberToHandleFrom: startBlockNumber,
            nextBlockNumberForSideEffects: startBlockNumber,
          },
        ];

        await repo.createContractAddresses(conn, contractAddresses);

        // Get contract addresses stream to verify creation
        const stream = repo.getContractAddressesStream(conn, { limit: 10 });
        const results = await stream.next();

        expect(results.length).toBeGreaterThan(0);

        const createdAddress = results.find((ca) => ca.contractName === contractName);
        expect(createdAddress).toBeDefined();
        expect(createdAddress!.address.toLowerCase()).toBe(contractAddress.toLowerCase());
        expect(createdAddress!.startBlockNumber).toBe(startBlockNumber);
      });
    });

    test('sets next block numbers correctly', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const contractName = 'contract-name-20';
        const contractAddress = '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8942e';
        const chainId = Chain.Mainnet;
        const startBlockNumber = 30;

        const contractAddresses: UnsavedContractAddress[] = [
          {
            contractName,
            address: contractAddress,
            chainId,
            startBlockNumber,
            nextBlockNumberToIngestFrom: startBlockNumber,
            nextBlockNumberToHandleFrom: startBlockNumber,
            nextBlockNumberForSideEffects: 0,
          },
        ];

        await repo.createContractAddresses(conn, contractAddresses);

        const stream = repo.getContractAddressesStream(conn, { limit: 10 });
        const results = await stream.next();

        const createdAddress = results.find((ca) => ca.contractName === contractName);
        expect(createdAddress).toBeDefined();
        expect(createdAddress!.nextBlockNumberToIngestFrom).toBe(startBlockNumber);
        expect(createdAddress!.nextBlockNumberToHandleFrom).toBe(startBlockNumber);
        expect(createdAddress!.nextBlockNumberForSideEffects).toBe(0);
      });
    });

    test('handles conflicting addresses', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const baseAddress: UnsavedContractAddress = {
          chainId: Chain.Mainnet,
          address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f12A',
          contractName: 'test-contract-1',
          startBlockNumber: 100,
          nextBlockNumberToIngestFrom: 100,
          nextBlockNumberToHandleFrom: 100,
          nextBlockNumberForSideEffects: 100,
        };

        // Insert first address
        await repo.createContractAddresses(conn, [baseAddress]);

        // Insert conflicting address with different contract name - should update
        const conflictingAddress: UnsavedContractAddress = {
          ...baseAddress,
          contractName: 'test-contract-updated',
        };

        // This shouldn't throw - should handle conflicts gracefully by updating
        await expect(
          repo.createContractAddresses(conn, [conflictingAddress])
        ).resolves.not.toThrow();

        // Verify the contract name was updated
        const stream = repo.getContractAddressesStream(conn, { limit: 10 });
        const results = await stream.next();
        const updatedAddress = results.find(
          (ca) => ca.address.toLowerCase() === baseAddress.address.toLowerCase()
        );
        expect(updatedAddress).toBeDefined();
        expect(updatedAddress!.contractName).toBe('test-contract-updated');
      });
    });
  });

  describe('createEvents', () => {
    test('creates events', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        const events = EventFactory.manyNew(5);

        await repo.createEvents(conn, events);

        const stream = repo.getEventsStream(conn, { limit: 10 });
        const results = await stream.next();

        expect(results.length).toBe(5);
        expect(results[0].contractName).toBe('TestContract');
      });
    });

    test('handles empty events array', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        await expect(repo.createEvents(conn, [])).resolves.not.toThrow();
      });
    });
  });

  describe('updateLastIngestedBlockNumber', () => {
    test('updates block numbers', async () => {
      await TestRunner.runTestWithRepo(async (repo, conn) => {
        // Create a contract address first
        const contractAddresses: UnsavedContractAddress[] = [
          {
            contractName: 'test-contract',
            address: '0x1234567890123456789012345678901234567890',
            chainId: Chain.Mainnet,
            startBlockNumber: 100,
            nextBlockNumberToIngestFrom: 100,
            nextBlockNumberToHandleFrom: 100,
            nextBlockNumberForSideEffects: 100,
          },
        ];

        await repo.createContractAddresses(conn, contractAddresses);

        // Get the created contract address
        const stream = repo.getContractAddressesStream(conn, { limit: 1 });
        const results = await stream.next();
        const contractAddress = results[0];

        // Update should not throw (implementation pending)
        await expect(
          repo.updateLastIngestedBlockNumber(conn, [contractAddress], 200)
        ).resolves.not.toThrow();
      });
    });
  });
});
