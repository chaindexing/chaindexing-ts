# CI/CD and Development Guide

This guide covers the CI/CD setup, development workflow, and available commands for the chaindexing
TypeScript implementation.

## 🚀 Quick Start

```bash
# Install dependencies
make install

# Run linting and formatting
make lint
make format

# Run tests
make tests.unit           # Unit tests (no database required)
make tests.integration    # Integration tests (requires PostgreSQL)

# Build all packages
make build

# Run full CI pipeline locally
make ci.all
```

## 📋 Available Commands

### Database Commands

```bash
make db.start          # Start PostgreSQL database
make db.stop           # Stop PostgreSQL database
make db.drop           # Drop database data
make db.reset          # Reset database (stop, drop, start)
make db.logs           # Show database logs
```

### Testing Commands

```bash
make tests.setup       # Setup test database
make tests.unit        # Run unit tests (26 tests, ~2s)
make tests.integration # Run integration tests (8 tests, ~3s)
make tests             # Run all tests
make tests.with.coverage # Run tests with coverage
make tests.watch       # Run tests in watch mode
make tests.ci          # Run CI test suite
```

### Development Commands

```bash
make dev               # Start development mode
make build             # Build all packages
make build.clean       # Clean and rebuild
```

### Code Quality Commands

```bash
make lint              # Run ESLint
make lint.fix          # Fix ESLint issues automatically
make format            # Format code with Prettier
make format.check      # Check code formatting
make type.check        # Run TypeScript type checking
```

### Setup Commands

```bash
make install           # Install dependencies
make install.clean     # Clean install dependencies
make outdated          # Check for outdated packages
```

### CI/CD Commands

```bash
make ci.lint           # Run linting checks
make ci.type           # Run type checking
make ci.test           # Run CI test suite
make ci.build          # Run build
make ci.all            # Run full CI pipeline
```

### Utility Commands

```bash
make clean             # Clean all build artifacts
make help              # Show help message
```

## 🔧 GitHub CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow (`.github/workflows/ci.yml`) that runs
on:

- **Push** to `main`/`master` branches
- **Pull requests** to `main`/`master` branches
- **Manual dispatch** (workflow_dispatch)
- **Scheduled runs** (weekly on Saturdays)

### CI Jobs

#### 1. **Lint and Format** (`lint`)

- Runs ESLint with zero warnings policy
- Checks Prettier formatting
- Performs TypeScript type checking
- **Duration**: ~15 minutes
- **Dependencies**: None

#### 2. **Unit Tests** (`test-unit`)

- Runs all unit tests (no database required)
- Tests core functionality, filters, updates, config validation
- **Duration**: ~15 minutes
- **Dependencies**: None

#### 3. **Integration Tests** (`test-integration`)

- Runs integration tests with PostgreSQL database
- Tests end-to-end flows, database operations
- **Duration**: ~30 minutes
- **Dependencies**: PostgreSQL service

#### 4. **Test Coverage** (`test-coverage`)

- Runs full test suite with coverage reporting
- Uploads coverage to Codecov (optional)
- **Duration**: ~30 minutes
- **Dependencies**: PostgreSQL service

#### 5. **Build** (`build`)

- Builds all TypeScript packages
- Uploads build artifacts
- **Duration**: ~15 minutes
- **Dependencies**: None

#### 6. **Outdated Dependencies** (`outdated`)

- Checks for outdated npm packages
- **Continue on error**: Yes (won't fail CI)
- **Duration**: ~10 minutes

#### 7. **Matrix Testing** (`matrix-test`)

- Tests across multiple Node.js versions (18, 20, 21, 22)
- Node.js 22 is experimental (continue on error)
- **Duration**: ~30 minutes per version

#### 8. **CI Success** (`ci-success`)

- Summary job that ensures all required jobs passed
- **Dependencies**: lint, test-unit, test-integration, build

## 🛠️ Development Workflow

### 1. **Local Development Setup**

```bash
# Clone and setup
git clone <repository>
cd chaindexing-ts
make install

# Start database (for integration tests)
make db.start

# Run tests
make tests.unit        # Quick feedback loop
make tests.integration # Full integration testing
```

### 2. **Code Quality Workflow**

```bash
# Before committing
make lint.fix          # Fix linting issues
make format            # Format code
make type.check        # Check types
make tests.unit        # Run unit tests

# Full pre-commit check
make ci.all            # Run complete CI pipeline locally
```

### 3. **Testing Strategy**

- **Unit Tests**: Fast, isolated, no database (26 tests)
- **Integration Tests**: End-to-end, with database (8 tests)
- **Repository Tests**: Database operations (6 tests)
- **Coverage Target**: >80% for statements, branches, functions

### 4. **Build and Deployment**

```bash
make build             # Build all packages
make build.clean       # Clean build (removes dist/, rebuilds)
```

## 📦 Package Structure

The project is organized as a monorepo with multiple packages:

```
chaindexing-ts/
├── chaindexing-core/           # Core functionality
├── chaindexing-config/         # Configuration management
├── chaindexing-postgres/       # PostgreSQL repository
├── chaindexing-repos/          # Repository abstractions
├── chaindexing-tests/          # Test utilities and suites
├── chaindexing/                # Main package
└── scripts/                    # Build and utility scripts
```

Each package has its own:

- `package.json` with build scripts
- `tsconfig.json` for TypeScript configuration
- Individual build outputs in `dist/` directories

## 🔍 Code Quality Standards

### ESLint Configuration

- **Parser**: `@typescript-eslint/parser`
- **Extends**: ESLint recommended + TypeScript recommended + Prettier
- **Rules**:
  - Zero warnings policy (`--max-warnings 0`)
  - Unused variables must start with `_`
  - Console.log allowed for debugging
  - Prefer const over let
  - No prototype builtins

### Prettier Configuration

- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes
- **Trailing Commas**: ES5 style

### TypeScript Configuration

- **Strict Mode**: Enabled
- **Target**: ES2020
- **Module**: CommonJS
- **Declaration**: Generated for libraries

## 🚨 Troubleshooting

### Common Issues

#### 1. **Linting Errors**

```bash
# Fix automatically
make lint.fix

# Check specific issues
npm run lint
```

#### 2. **Database Connection Issues**

```bash
# Ensure PostgreSQL is running
make db.start

# Check database logs
make db.logs

# Reset database
make db.reset
```

#### 3. **Build Failures**

```bash
# Clean and rebuild
make build.clean

# Check TypeScript errors
make type.check
```

#### 4. **Test Failures**

```bash
# Run specific test suites
make tests.unit        # No database required
make tests.integration # Requires database setup

# Setup test database
make tests.setup
```

### Environment Variables

For local development, ensure these are set:

```bash
# .env.test file
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/chaindexing_test
NODE_ENV=test
SETUP_TEST_DB=true
```

### CI/CD Debugging

#### Local CI Simulation

```bash
# Run the same checks as CI
make ci.all

# Individual CI steps
make ci.lint
make ci.type
make ci.build
make ci.test
```

#### GitHub Actions Debugging

- Check the Actions tab in GitHub repository
- Review job logs for specific failures
- Ensure secrets are configured (if using Codecov)
- Verify PostgreSQL service is healthy

## 📊 Performance Metrics

### Test Performance

- **Unit Tests**: ~2.4 seconds (26 tests)
- **Integration Tests**: ~2.7 seconds (8 tests)
- **Repository Tests**: ~2.7 seconds (6 tests)
- **Total Test Suite**: ~8-10 seconds

### Build Performance

- **Individual Package**: ~2-3 seconds
- **All Packages**: ~2.4 seconds (parallel build)
- **Clean Build**: ~5-7 seconds

### CI Performance

- **Lint Job**: ~2-3 minutes
- **Unit Tests**: ~2-3 minutes
- **Integration Tests**: ~4-5 minutes
- **Build Job**: ~2-3 minutes
- **Total Pipeline**: ~8-12 minutes

## 🔄 Continuous Integration Best Practices

### 1. **Pull Request Workflow**

- All CI jobs must pass before merge
- Code review required
- Automatic formatting and linting checks
- Coverage reports for changes

### 2. **Branch Protection**

- `main` branch protected
- Require CI status checks
- Require up-to-date branches
- Dismiss stale reviews on new commits

### 3. **Dependency Management**

- Weekly outdated dependency checks
- Automated security updates (via Dependabot)
- Lock file consistency checks

### 4. **Release Process**

```bash
# Future release workflow (not yet implemented)
make publish.dry       # Dry run
make publish          # Actual publish
```

## 📈 Monitoring and Observability

### Code Coverage

- **Target**: >80% coverage
- **Reports**: Generated in `coverage/` directory
- **Upload**: To Codecov (optional, requires token)

### Performance Monitoring

- Test execution times tracked
- Build performance metrics
- CI job duration monitoring

### Quality Metrics

- ESLint error/warning counts
- TypeScript compilation errors
- Test pass/fail rates

## 🎯 Future Improvements

### Planned Enhancements

1. **Publishing Pipeline**: Automated npm package publishing
2. **Docker Integration**: Containerized development environment
3. **E2E Testing**: Browser-based end-to-end tests
4. **Performance Testing**: Load and stress testing
5. **Security Scanning**: Automated vulnerability scanning
6. **Semantic Releases**: Automated versioning and changelogs

### Contributing Guidelines

1. Follow the established code quality standards
2. Ensure all tests pass locally before pushing
3. Add tests for new functionality
4. Update documentation for API changes
5. Use conventional commit messages

For more information, see the main [README.md](./README.md) and [TESTING.md](./TESTING.md) files.
