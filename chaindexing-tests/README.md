# Chaindexing TypeScript Test Suite

Comprehensive test suite for the TypeScript implementation of Chaindexing, ensuring feature parity
with the Rust version.

## Test Structure

### Unit Tests

- **State Tests** (`__tests__/states.test.ts`) - Test state creation, updates, and deletion
- **Repository Tests** (`__tests__/repositories.test.ts`) - Test database operations
- **Event Handler Tests** (`__tests__/event-handlers.test.ts`) - Test pure and side-effect handlers

### Integration Tests

- **Integration Tests** (`__tests__/integration.test.ts`) - End-to-end workflow testing
- **Configuration Tests** - Validate configuration and setup

## Test Infrastructure

### Database Setup

- Automatic test database creation and management
- Table truncation between tests
- Migration support for test states

### Test Factories

- **Contract Factory** - Create test contracts with handlers
- **Event Factory** - Generate test events and data
- **Provider Factory** - Mock Web3 providers for testing
- **Handler Factory** - Test event handlers

### Test Utilities

- **TestRunner** - Database transaction management
- **TestDatabase** - Database lifecycle management
- **Mock Providers** - Simulate blockchain data

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Setup test database
npm run test:setup
```

## Environment Setup

Create a `.env` file for test configuration:

```bash
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/chaindexing_test
SETUP_TEST_DB=true
```

## Test Coverage

The test suite covers:

✅ **State Management**

- ContractState, ChainState, MultiChainState
- State creation, reading, updating, deletion
- State migrations

✅ **Event Handling**

- Pure handlers for deterministic indexing
- Side-effect handlers for notifications
- Event parameter parsing
- Handler context management

✅ **Repository Operations**

- Contract address management
- Event storage and retrieval
- Database migrations
- Connection pooling

✅ **Configuration**

- Config validation
- Chain and contract setup
- Parameter validation

✅ **Integration**

- Full indexing workflow
- Provider integration
- Multi-chain support
- Error handling

## Test Patterns

Based on the Rust implementation test patterns:

1. **Database Transactions** - Each test runs in isolation
2. **Factory Pattern** - Consistent test data generation
3. **Mock Providers** - Simulate blockchain interactions
4. **Setup/Teardown** - Clean test environment

## Continuous Integration

Tests are designed to run in CI environments with:

- Sequential execution to avoid database conflicts
- Automatic database setup
- Comprehensive error reporting
- Coverage collection
