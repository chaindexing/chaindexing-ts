import { UnsavedContractAddressFactory } from '@chaindexing/tests';
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

  describe.only('createContractAddresses', async () => {
    it('saves unsaved contract addresses', async (conn) => {
      const unsavedContractAddresses = UnsavedContractAddressFactory.manyNew(2).toSorted();
      await repo.createContractAddresses(conn, unsavedContractAddresses);

      const streamedAddresses = repo.streamContractAddresses(conn);

      let contractAddresses = await streamedAddresses.next();
      if (!contractAddresses) return;

      console.log('did not return');

      const contractAddressesSorted = contractAddresses.toSorted();

      contractAddressesSorted.forEach(({ id, ...contractAddress }, index) => {
        expect(contractAddress).to.deep.equal(unsavedContractAddresses[index]);
      });
    });

    it('updates contract name when there is a conflict', async (conn) => {
      const unsavedContractAddresses = UnsavedContractAddressFactory.manyNewConflicting(2);
      const [unsaved1, unsaved2] = unsavedContractAddresses;

      assert(unsaved1.contractName !== unsaved2.contractName);

      await repo.createContractAddresses(conn, [unsaved1]);
      await repo.createContractAddresses(conn, [unsaved2]);

      const streamedAddresses = repo.streamContractAddresses(conn);

      let contractAddresses = await streamedAddresses.next();
      if (!contractAddresses) return;

      expect(contractAddresses).to.have.length(1);
      const [{ contractName }] = contractAddresses;
      expect(contractName).to.equal(unsaved2.contractName);
    });

    it('does nothing for an empty list', async (conn) => {
      await repo.createContractAddresses(conn, []);

      const streamedAddresses = repo.streamContractAddresses(conn);

      let contractAddresses = await streamedAddresses.next();

      expect(contractAddresses).to.deep.equal([]);
    });
  });

  describe('streamContractAddresses', () => {
    it('returns unit list when there is just one contract address in the Repo', async (conn) => {
      const unsavedContractAddress = UnsavedContractAddressFactory.new();
      await repo.createContractAddresses(conn, [unsavedContractAddress]);

      const streamedAddresses = repo.streamContractAddresses(conn);
      let contractAddresses = await streamedAddresses.next();
      if (!contractAddresses) return;

      const [{ id, ...contractAddress }] = contractAddresses;

      expect(contractAddress).to.deep.equal(unsavedContractAddress);
    });

    it('returns an empty list when there are no contract addresses in the repo', async (conn) => {
      const streamedAddresses = repo.streamContractAddresses(conn);

      let contractAddresses = await streamedAddresses.next();

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
