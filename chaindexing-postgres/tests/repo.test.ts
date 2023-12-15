import { assert, expect } from 'chai';
import { PostgresRepo, PostgresRepoConn } from 'chaindexing-postgres/src';
import { UnsavedContractAddressFactory } from '@chaindexing/tests';

describe('Repo', async () => {
  const repo = new PostgresRepo('postgres://postgres:postgres@localhost:5432/chaindexing_db');
  const pool = await repo.getPool(1);
  const rootConn = await repo.getConn(pool);

  before(async () => {
    await repo.migrate(rootConn);
  });

  describe('createContractAddresses', async () => {
    it(
      'saves unsaved contract addresses',
      runTest(repo, rootConn, async (conn) => {
        const unsavedContractAddresses = UnsavedContractAddressFactory.manyNew(2).toSorted();
        await repo.createContractAddresses(conn, unsavedContractAddresses);

        await repo.streamContractAddresses(conn, (contractAddresses) => {
          const contractAddressesSorted = contractAddresses.toSorted();

          contractAddressesSorted.forEach(({ id, ...contractAddress }, index) => {
            expect(contractAddress).to.deep.equal(unsavedContractAddresses[index]);
          });
        });
      })
    );
    it(
      'updates contract name when there is a conflict',
      runTest(repo, rootConn, async (conn) => {
        const unsavedContractAddresses = UnsavedContractAddressFactory.manyNewConflicting(2);
        const [unsaved1, unsaved2] = unsavedContractAddresses;

        assert(unsaved1.contractName !== unsaved2.contractName);

        await repo.createContractAddresses(conn, [unsaved1]);
        await repo.createContractAddresses(conn, [unsaved2]);

        await repo.streamContractAddresses(conn, (contractAddresses) => {
          expect(contractAddresses).to.have.length(1);
          const [{ contractName }] = contractAddresses;
          expect(contractName).to.equal(unsaved2.contractName);
        });
      })
    );

    it(
      'does nothing for an empty list',
      runTest(repo, rootConn, async (conn) => {
        await repo.createContractAddresses(conn, []);

        await repo.streamContractAddresses(conn, (contractAddresses) => {
          expect(contractAddresses).to.deep.equal([]);
        });
      })
    );
  });

  describe('streamContractAddresses', () => {
    it(
      'returns unit list when there is just one contract address in the Repo',
      runTest(repo, rootConn, async (conn) => {
        const unsavedContractAddress = UnsavedContractAddressFactory.new();
        await repo.createContractAddresses(conn, [unsavedContractAddress]);

        await repo.streamContractAddresses(conn, ([{ id, ...contractAddress }]) => {
          expect(contractAddress).to.deep.equal(unsavedContractAddress);
        });
      })
    );

    it(
      'returns an empty list when there are no contract addresses in the repo',
      runTest(repo, rootConn, async (conn) => {
        await repo.streamContractAddresses(conn, (contractAddresses) => {
          expect(contractAddresses).to.deep.equal([]);
        });
      })
    );
  });
});

const runTest = (
  repo: PostgresRepo,
  conn: PostgresRepoConn,
  test: (conn: PostgresRepoConn) => Promise<void>
) => {
  return async () => {
    try {
      await repo.runInTransaction(conn, async (txConn) => {
        await test(txConn);

        throw new Error('ROLLBACK');
      });
    } catch (error: unknown) {
      const isTestSuiteError = !(error instanceof Error && error.message === 'ROLLBACK');

      if (isTestSuiteError) throw error;
    }
  };
};
