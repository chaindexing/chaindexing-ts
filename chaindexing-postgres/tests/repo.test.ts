import { expect } from 'chai';
import { PostgresRepo, PostgresRepoConn, PostgresRepoPool } from 'chaindexing-postgres/src';
import { UnsavedContractAddressFactory } from '@chaindexing/tests';

describe('Repo', async () => {
  const repo = new PostgresRepo('postgres://postgres:postgres@localhost:5432/chaindexing_db');
  const pool = await repo.getPool(5);

  before(async () => {
    await repo.migrate(await repo.getConn(pool));
  });

  describe('createContractAddresses', async () => {
    it(
      'saves unsaved contract addresses',
      runTest(repo, pool, async (conn) => {
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
      'does nothing for an empty list',
      runTest(repo, pool, async (conn) => {
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
      runTest(repo, pool, async (conn) => {
        const unsavedContractAddress = UnsavedContractAddressFactory.new();
        await repo.createContractAddresses(conn, [unsavedContractAddress]);

        await repo.streamContractAddresses(conn, ([{ id, ...contractAddress }]) => {
          expect(contractAddress).to.deep.equal(unsavedContractAddress);
        });
      })
    );

    it(
      'returns an empty list when there are no contract addresses in the repo',
      runTest(repo, pool, async (conn) => {
        await repo.streamContractAddresses(conn, (contractAddresses) => {
          expect(contractAddresses).to.deep.equal([]);
        });
      })
    );
  });
});

const runTest = (
  repo: PostgresRepo,
  pool: PostgresRepoPool,
  test: (conn: PostgresRepoConn) => Promise<void>
) => {
  return async () => {
    try {
      await repo.runInTransaction(await repo.getConn(pool), async (conn) => {
        await test(conn);

        throw new Error('AVOID_TRANSACTION_ERROR');
      });
    } catch (error: unknown) {
      const isTestSuiteError = !(
        error instanceof Error && error.message === 'AVOID_TRANSACTION_ERROR'
      );

      if (isTestSuiteError) throw error;
    }
  };
};
