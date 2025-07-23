# Database commands
db.start:
	docker-compose up -d

db.stop: 
	docker-compose down

db.drop:
	rm -rf ./postgres-data

db.reset:
	make db.stop && make db.drop && make db.start

db.logs:
	docker-compose logs -f postgres

# Test setup and execution
tests.setup:
	npm run setup-db

tests.unit:
	npm run test:unit

tests.integration:
	make tests.setup && npm run test:integration

tests:
	make tests.setup && npm test

tests.with.coverage:
	make tests.setup && npm run test:coverage

tests.watch:
	npm run test:watch

tests.ci:
	npm run ci

# Development commands
dev:
	npm run dev

build:
	npm run build

build.clean:
	npm run build:clean && npm run build

# Linting and formatting
lint:
	npm run lint

lint.fix:
	npm run lint:fix

format:
	npm run format

format.check:
	npm run format:check

type.check:
	npm run type-check

# Install and setup
install:
	npm install

install.clean:
	rm -rf node_modules package-lock.json && npm install

outdated:
	npm run outdated

# CI/CD commands
ci.lint:
	npm run lint:strict && npm run format:check

ci.type:
	npm run type-check

ci.test:
	make tests.ci

ci.build:
	npm run build

ci.all:
	make ci.lint && make ci.type && make ci.build && make ci.test

# Documentation
doc:
	npm run build && echo "Documentation built successfully"

# Publishing (for future use)
publish.dry:
	echo "Dry run publish - not implemented yet"

publish:
	echo "Publish - not implemented yet"

# Utility commands
clean:
	npm run build:clean
	rm -rf node_modules
	rm -rf .nyc_output
	rm -rf coverage

help:
	@echo "Available commands:"
	@echo "  Database:"
	@echo "    db.start          - Start PostgreSQL database"
	@echo "    db.stop           - Stop PostgreSQL database"
	@echo "    db.drop           - Drop database data"
	@echo "    db.reset          - Reset database (stop, drop, start)"
	@echo "    db.logs           - Show database logs"
	@echo ""
	@echo "  Testing:"
	@echo "    tests.setup       - Setup test database"
	@echo "    tests.unit        - Run unit tests"
	@echo "    tests.integration - Run integration tests"
	@echo "    tests             - Run all tests"
	@echo "    tests.with.coverage - Run tests with coverage"
	@echo "    tests.watch       - Run tests in watch mode"
	@echo "    tests.ci          - Run CI test suite"
	@echo ""
	@echo "  Development:"
	@echo "    dev               - Start development mode"
	@echo "    build             - Build all packages"
	@echo "    build.clean       - Clean and rebuild"
	@echo ""
	@echo "  Code Quality:"
	@echo "    lint              - Run ESLint"
	@echo "    lint.fix          - Fix ESLint issues"
	@echo "    format            - Format code with Prettier"
	@echo "    format.check      - Check code formatting"
	@echo "    type.check        - Run TypeScript type checking"
	@echo ""
	@echo "  Setup:"
	@echo "    install           - Install dependencies"
	@echo "    install.clean     - Clean install dependencies"
	@echo "    outdated          - Check for outdated packages"
	@echo ""
	@echo "  CI/CD:"
	@echo "    ci.lint           - Run linting checks"
	@echo "    ci.type           - Run type checking"
	@echo "    ci.test           - Run CI test suite"
	@echo "    ci.build          - Run build"
	@echo "    ci.all            - Run full CI pipeline"
	@echo ""
	@echo "  Utilities:"
	@echo "    clean             - Clean all build artifacts"
	@echo "    help              - Show this help message"

.PHONY: db.start db.stop db.drop db.reset db.logs tests.setup tests.unit tests.integration tests tests.with.coverage tests.watch tests.ci dev build build.clean lint lint.fix format format.check type.check install install.clean outdated ci.lint ci.type ci.test ci.build ci.all doc publish.dry publish clean help