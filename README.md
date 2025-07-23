# Chaindexing TypeScript

Index any EVM chain and query in SQL - TypeScript implementation based on the Rust version.

## Features

- 🌐 **Multi-chain support** - Index multiple EVM chains simultaneously
- ⚡ **Real-time indexing** - Process events as they happen
- 🗄️ **SQL queries** - Query indexed data using standard SQL
- 🔄 **State management** - Track contract states, chain states, and multi-chain states
- 🎯 **Event handlers** - Pure handlers for deterministic indexing and side-effect handlers for
  notifications
- 🏗️ **Type-safe** - Full TypeScript support with comprehensive type definitions
- 🚀 **Production-ready** - Based on battle-tested Rust implementation
- 🔧 **Configurable** - Extensive configuration options for performance tuning

## Quick Start

### Installation

```bash
npm install @chaindexing/chaindexing
npm install @chaindexing/postgres  # For PostgreSQL support
```

### Basic Example

```typescript
import {
  indexStates,
  Chain,
  createContract,
  PureHandler,
  PureHandlerContext,
  BaseContractState,
  createFilters,
  createUpdates,
} from '@chaindexing/chaindexing';
import { Config } from '@chaindexing/config';
import { PostgresRepo } from '@chaindexing/postgres';

// Define your state
class Nft extends BaseContractState {
  constructor(
    public tokenId: number,
    public ownerAddress: string
  ) {
    super();
  }

  tableName(): string {
    return 'nfts';
  }
}

// Create event handler
class TransferHandler implements PureHandler {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: PureHandlerContext): Promise<void> {
    const eventParams = context.getEventParams();

    const from = eventParams.getAddressString('from');
    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    if (from === '0x0000000000000000000000000000000000000000') {
      // Mint: create new NFT
      const newNft = new Nft(tokenId, to);
      await newNft.create(context);
    } else {
      // Transfer: update existing NFT
      const existingNft = new Nft(tokenId, from);
      const updates = createUpdates('owner_address', to);
      await existingNft.update(updates, context);
    }
  }
}

// State migrations
class NftMigrations {
  migrations(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS nfts (
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL
      )`,
    ];
  }
}

// Setup and start
async function main() {
  const repo = new PostgresRepo('postgresql://localhost:5432/chaindexing');

  const config = new Config(repo)
    .addChain(Chain.Mainnet, 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
    .addContract(
      createContract('ERC721Token')
        .addAddress('0x...', Chain.Mainnet, 18000000)
        .addEventHandler(new TransferHandler())
        .addStateMigrations(new NftMigrations())
        .build()
    );

  await indexStates(config);
}

main().catch(console.error);
```

## Core Concepts

### States

Chaindexing supports three types of states:

1. **ContractState** - States derived from a single contract
2. **ChainState** - States derived from multiple contracts within a chain
3. **MultiChainState** - States derived from contracts across multiple chains

```typescript
import { BaseContractState } from '@chaindexing/chaindexing';

class MyContractState extends BaseContractState {
  constructor(
    public id: number,
    public value: string
  ) {
    super();
  }

  tableName(): string {
    return 'my_states';
  }
}
```

### Event Handlers

#### Pure Handlers

Deterministic handlers for indexing states:

```typescript
class MyPureHandler implements PureHandler {
  abi(): string {
    return 'event MyEvent(uint256 indexed id, string value)';
  }

  async handleEvent(context: PureHandlerContext): Promise<void> {
    const params = context.getEventParams();
    const id = params.getU32('id');
    const value = params.getString('value');

    const state = new MyContractState(id, value);
    await state.create(context);
  }
}
```

#### Side Effect Handlers

Non-deterministic handlers for notifications, bridging, etc:

```typescript
class MySideEffectHandler implements SideEffectHandler<AppState> {
  abi(): string {
    return 'event MyEvent(uint256 indexed id, string value)';
  }

  async handleEvent(context: SideEffectHandlerContext<AppState>): Promise<void> {
    const params = context.getEventParams();
    const sharedState = await context.getSharedState();

    // Send notification, update external system, etc.
    await sendNotification(params.getString('value'));

    // Update shared state
    sharedState.notificationCount++;
  }
}
```

### Contract Builder

Create contracts with addresses, handlers, and migrations:

```typescript
const contract = createContract<SharedState>('MyContract')
  .addAddress('0x...', Chain.Mainnet, 18000000)
  .addAddress('0x...', Chain.Polygon, 25000000)
  .addEventHandler(new MyPureHandler())
  .addSideEffectHandler(new MySideEffectHandler())
  .addStateMigrations(new MyMigrations())
  .build();
```

### Configuration

```typescript
const config = new Config(repo)
  .addChain(Chain.Mainnet, rpcUrl)
  .addContract(contract)
  .withBlocksPerBatch(450) // Blocks per ingestion batch
  .withHandlerRateMs(4000) // Handler execution interval
  .withIngestionRateMs(20000) // Ingestion interval
  .withMinConfirmationCount(40) // Confirmations before processing
  .withChainConcurrency(4) // Concurrent chain processing
  .withInitialState(initialState) // Shared state for side effects
  .reset(1); // Reset indexing (optional)
```

## Architecture

The TypeScript implementation mirrors the Rust version's architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Config        │    │   Contracts     │    │   Chains        │
│                 │    │                 │    │                 │
│ - Repo          │    │ - Handlers      │    │ - RPC URLs      │
│ - Chains        │    │ - Migrations    │    │ - Chain IDs     │
│ - Contracts     │    │ - Addresses     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Orchestrator   │
                    │                 │
                    │ - Event Ingestion│
                    │ - Event Handling │
                    │ - State Management│
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Repository    │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Migrations    │
                    │ - Transactions  │
                    └─────────────────┘
```

## Database Support

Currently supports PostgreSQL with Drizzle ORM:

```typescript
import { PostgresRepo } from '@chaindexing/postgres';

const repo = new PostgresRepo('postgresql://user:pass@localhost:5432/db');
```

## Performance Tuning

Adjust these configuration parameters based on your needs:

- `blocksPerBatch`: Higher values = faster historical sync, higher RPC usage
- `handlerRateMs`: Lower values = faster processing, higher CPU usage
- `ingestionRateMs`: Lower values = more real-time, higher RPC usage
- `chainConcurrency`: Higher values = faster multi-chain, more resources

## Error Handling

The library includes comprehensive error handling:

```typescript
try {
  await indexStates(config);
} catch (error) {
  if (error instanceof ConfigError) {
    console.error('Configuration error:', error.message);
  } else {
    console.error('Indexing error:', error);
  }
}
```

## Contributing

This TypeScript implementation is based on the battle-tested Rust version. Contributions are
welcome!

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Projects

- [chaindexing-rs](https://github.com/chaindexing/chaindexing-rs) - The original Rust implementation
- [chaindexing-examples](https://github.com/chaindexing/chaindexing-examples) - Working examples and
  tutorials
