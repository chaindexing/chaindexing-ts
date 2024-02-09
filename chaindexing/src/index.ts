import { Config } from '@chaindexing/config';
import { Repo } from '@chaindexing/repos';

export async function indexStates<Pool, Conn, UserRepo extends Repo<Pool, Conn>>(
  config: Config<Pool, Conn, UserRepo>
) {
  config.validate();
  await setup();
}

async function setup() {
  // TODO
}
