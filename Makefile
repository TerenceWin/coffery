export PATH := /usr/local/go/bin:$(PATH)

.PHONY: dev dev-fe dev-be db db-stop migrate test test-be lint-fe install

# ── Dev ──────────────────────────────────────────────────────────────────────

dev: db
	@echo "Starting frontend and backend..."
	@$(MAKE) -j2 dev-fe dev-be

dev-fe:
	@cd frontend && npm run dev

dev-be:
	@cd backend && go run ./cmd/server

# ── Database ─────────────────────────────────────────────────────────────────

db:
	@docker compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker compose exec postgres pg_isready -U coffery -d coffee_shop > /dev/null 2>&1; do sleep 1; done
	@echo "PostgreSQL is ready."

db-stop:
	@docker compose stop postgres

db-reset:
	@docker compose down -v
	@$(MAKE) db

# ── Migrations ────────────────────────────────────────────────────────────────

migrate:
	@cd backend && go run ./cmd/server --migrate-only 2>/dev/null || \
		go run ./cmd/server & PID=$$!; sleep 2; kill $$PID

# ── Install ───────────────────────────────────────────────────────────────────

install:
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "Installing backend dependencies..."
	@cd backend && go mod download

# ── Tests ─────────────────────────────────────────────────────────────────────

test: test-be

test-be:
	@cd backend && go test ./... -v -race -timeout 60s

test-fe:
	@cd frontend && npm test

# ── Lint ──────────────────────────────────────────────────────────────────────

lint-fe:
	@cd frontend && npm run lint

lint-be:
	@cd backend && go vet ./...

lint: lint-fe lint-be

# ── Build ─────────────────────────────────────────────────────────────────────

build-fe:
	@cd frontend && npm run build

build-be:
	@cd backend && go build -o bin/server ./cmd/server

build: build-fe build-be
