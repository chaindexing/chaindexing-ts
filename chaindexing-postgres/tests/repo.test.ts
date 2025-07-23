import { ContractAddress, Event } from '@chaindexing/core';
import { EventFactory, UnsavedContractAddressFactory } from '@chaindexing/tests';
import { assert, expect } from 'chai';
import { PostgresRepo, PostgresRepoConn, PostgresRepoMigrations } from 'chaindexing-postgres/src';

describe('Repo', async () => {
  const repo = new PostgresRepo('postgres://postgres:postgres@localhost:5432/chaindexing_db');
  const pool = await repo.getPool(1);
  const rootConn = await repo.getConn(pool);

  const it = getItWithConn(repo, rootConn);

  before(async () => {
    const postgresRepoMigrations = new PostgresRepoMigrations();
    await repo.migrate(rootConn, postgresRepoMigrations.getInternalMigrations());
  });

  describe('createContractAddresses', async () => {
    it('saves unsaved contract addresses', async (conn) => {
      const unsavedContractAddresses = UnsavedContractAddressFactory.manyNew(2).toSorted();
      await repo.createContractAddresses(conn, unsavedContractAddresses);

      const contractAddressStream = repo.getContractAddressesStream(conn);

      const contractAddresses = (await contractAddressStream.next()) as ContractAddress[];

      const contractAddressesSorted = contractAddresses.toSorted();

      contractAddressesSorted.forEach(({ id: _id, ...contractAddress }, index) => {
        expect(contractAddress).to.deep.equal(unsavedContractAddresses[index]);
      });
    });

    it('updates contract name when there is a conflict', async (conn) => {
      const unsavedContractAddresses = UnsavedContractAddressFactory.manyNewConflicting(2);
      const [unsaved1, unsaved2] = unsavedContractAddresses;

      assert(unsaved1.contractName !== unsaved2.contractName);

      await repo.createContractAddresses(conn, [unsaved1]);
      await repo.createContractAddresses(conn, [unsaved2]);

      const contractAddressStream = repo.getContractAddressesStream(conn);

      const contractAddresses = (await contractAddressStream.next()) as ContractAddress[];

      expect(contractAddresses).to.have.length(1);
      const [{ contractName }] = contractAddresses;
      expect(contractName).to.equal(unsaved2.contractName);
    });

    it('does nothing for an empty list', async (conn) => {
      await repo.createContractAddresses(conn, []);

      const contractAddressStream = repo.getContractAddressesStream(conn);

      const contractAddresses = await contractAddressStream.next();

      expect(contractAddresses).to.deep.equal([]);
    });
  });

  describe('getContractAddressesStream', () => {
    it('returns unit list when there is just one contract address in the Repo', async (conn) => {
      const unsavedContractAddress = UnsavedContractAddressFactory.new();
      await repo.createContractAddresses(conn, [unsavedContractAddress]);

      const contractAddressStream = repo.getContractAddressesStream(conn);
      const contractAddresses = (await contractAddressStream.next()) as ContractAddress[];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ id: _id, ...contractAddress }] = contractAddresses;

      expect(contractAddress).to.deep.equal(unsavedContractAddress);
    });

    it('returns an empty list when there are no contract addresses in the repo', async (conn) => {
      const contractAddressStream = repo.getContractAddressesStream(conn);

      const contractAddresses = await contractAddressStream.next();

      expect(contractAddresses).to.deep.equal([]);
    });
  });

  describe('createEvents', async () => {
    it('saves events', async (conn) => {
      const newEvents = EventFactory.manyNew(2).toSorted();
      await repo.createEvents(conn, newEvents);

      const eventsStream = repo.getEventsStream(conn);

      const events = (await eventsStream.next()) as Event[];

      const eventsSorted = events.toSorted();

      eventsSorted.forEach(({ id: _id, insertedAt: _insertedAt, ...event }, index) => {
        expect(event).to.deep.equal(newEvents[index]);
      });
    });

    it('does nothing for an empty list', async (conn) => {
      await repo.createEvents(conn, []);

      const eventsStream = repo.getEventsStream(conn);

      const contractAddresses = await eventsStream.next();

      expect(contractAddresses).to.deep.equal([]);
    });
  });
});

type TestFn = (conn: PostgresRepoConn) => Promise<void>;

const getItWithConn = (repo: PostgresRepo, conn: PostgresRepoConn) => {
  return (specMessage: string, testFn: TestFn) =>
    it(specMessage, ensureRollbackAfterTest(repo, conn, testFn));
};

const ensureRollbackAfterTest = (repo: PostgresRepo, conn: PostgresRepoConn, testFn: TestFn) => {
  return async () => {
    try {
      await repo.runInTransaction(conn, async (txConn) => {
        await testFn(txConn);

        throw new Error('ROLLBACK');
      });
    } catch (error: unknown) {
      const isTestSuiteError = !(error instanceof Error && error.message === 'ROLLBACK');

      if (isTestSuiteError) throw error;
    }
  };
};
