import {
  indexStates,
  Chain,
  createContract,
  PureHandler,
  SideEffectHandler,
  PureHandlerContext,
  SideEffectHandlerContext,
  BaseContractState,
  createUpdates,
  StateMigrations,
} from './chaindexing/src';
import { Config } from './chaindexing-config/src';
import { PostgresRepo } from './chaindexing-postgres/src';

// Example NFT state
class Nft extends BaseContractState {
  public tokenId: number;
  public ownerAddress: string;

  constructor(tokenId: number, ownerAddress: string) {
    super();
    this.tokenId = tokenId;
    this.ownerAddress = ownerAddress;
  }

  tableName(): string {
    return 'nfts';
  }
}

// State migrations for NFT
class NftMigrations implements StateMigrations {
  migrations(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS nfts (
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS nfts_token_id_index ON nfts(token_id)`,
    ];
  }
}

// Transfer event handler (Pure Handler)
class TransferHandler implements PureHandler {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: PureHandlerContext): Promise<void> {
    const eventParams = context.getEventParams();

    const from = eventParams.getAddressString('from');
    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    console.log(`Processing Transfer: ${from} -> ${to}, tokenId: ${tokenId}`);

    // In a real implementation, this would query the database
    // For now, we'll create a new NFT or update existing one
    if (from === '0x0000000000000000000000000000000000000000') {
      // Mint: create new NFT
      const newNft = new Nft(tokenId, to);
      console.log(`Minted NFT ${tokenId} to ${to}`);
      // In real implementation: await newNft.create(context);
    } else {
      // Transfer: update existing NFT
      const existingNft = new Nft(tokenId, from);
      const updates = createUpdates('owner_address', to);
      console.log(`Transferred NFT ${tokenId} from ${from} to ${to}`);
      // In real implementation: await existingNft.update(updates, context);
    }
  }
}

// Notification handler (Side Effect Handler)
interface AppState {
  notificationCount: number;
  lastProcessedBlock: number;
}

class NotificationHandler implements SideEffectHandler<AppState> {
  abi(): string {
    return 'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)';
  }

  async handleEvent(context: SideEffectHandlerContext<AppState>): Promise<void> {
    const eventParams = context.getEventParams();
    const sharedState = await context.getSharedState();

    const to = eventParams.getAddressString('to');
    const tokenId = eventParams.getU32('tokenId');

    // Send notification (side effect)
    await this.sendNotification(to, tokenId);

    // Update shared state
    sharedState.notificationCount++;
    sharedState.lastProcessedBlock = context.event.blockNumber;

    console.log(`Sent notification for NFT ${tokenId} to ${to}`);
    console.log(`Total notifications: ${sharedState.notificationCount}`);
  }

  private async sendNotification(address: string, tokenId: number): Promise<void> {
    // Mock notification service
    console.log(`📧 Notification: NFT ${tokenId} transferred to ${address}`);
  }
}

// Main function demonstrating usage
async function main() {
  try {
    // Create PostgreSQL repository
    const repo = new PostgresRepo('postgresql://username:password@localhost:5432/chaindexing');

    // Create configuration
    const config = new Config(repo)
      // Add Ethereum mainnet
      .addChain(Chain.Mainnet, 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
      // Add Polygon
      .addChain(Chain.Sepolia, 'https://eth-sepolia.g.alchemy.com/v2/your-api-key')
      // Configure processing parameters
      .withBlocksPerBatch(100)
      .withHandlerRateMs(5000)
      .withIngestionRateMs(10000)
      .withMinConfirmationCount(12)
      // Add shared state for side effects
      .withInitialState<AppState>({
        notificationCount: 0,
        lastProcessedBlock: 0,
      })
      // Add contract with handlers
      .addContract(
        createContract<AppState>('ERC721Token')
          // Add contract address on Ethereum mainnet
          .addAddress('0x1234567890123456789012345678901234567890', Chain.Mainnet, 18000000)
          // Add contract address on Sepolia testnet
          .addAddress('0x1234567890123456789012345678901234567890', Chain.Sepolia, 4000000)
          // Add event handlers
          .addEventHandler(new TransferHandler())
          .addSideEffectHandler(new NotificationHandler())
          // Add state migrations
          .addStateMigrations(new NftMigrations())
          .build()
      );

    console.log('🚀 Starting Chaindexing TypeScript Implementation');
    console.log('📊 Configuration:');
    console.log(`   - Chains: ${Array.from(config.chains.keys()).join(', ')}`);
    console.log(`   - Contracts: ${config.contracts.map((c) => c.name).join(', ')}`);
    console.log(`   - Blocks per batch: ${config.blocksPerBatch}`);
    console.log(`   - Handler rate: ${config.handlerRateMs}ms`);
    console.log(`   - Ingestion rate: ${config.ingestionRateMs}ms`);

    // Start indexing
    await indexStates(config);
  } catch (error) {
    console.error('❌ Error starting chaindexing:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
