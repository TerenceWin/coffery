# Coffee Shop App

A full-stack monorepo for a coffee shop ordering system.

- **Frontend** — React 18 + Vite, served on `http://localhost:3000`
- **Backend** — Go + Gin REST API, served on `http://localhost:8080`
- **Database** — PostgreSQL 16 via Docker

---

## Prerequisites

Make sure the following are installed on your machine before getting started.

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org) | 20+ | Run the frontend dev server |
| [Go](https://golang.org/dl) | 1.23+ | Run the backend server |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | Latest | Run PostgreSQL in a container |
| [Make](https://www.gnu.org/software/make/) | Any | Run project commands (pre-installed on macOS/Linux) |

> **macOS shortcut:** Install Node and Go via Homebrew:
> ```bash
> brew install node go
> brew install --cask docker
> ```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd Coffery
```

### 2. Set up environment variables

Copy the example env files for both services:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The defaults work out of the box for local development — no changes needed.

### 3. Install dependencies

```bash
make install
```

This runs `npm install` for the frontend and `go mod download` for the backend.

### 4. Start Docker Desktop

Open Docker Desktop and wait for it to finish starting up before continuing.

### 5. Start everything

```bash
make dev
```

This will:
1. Pull and start a PostgreSQL 16 container
2. Wait until the database is healthy
3. Start the Go backend (with auto-migration on boot)
4. Start the Vite frontend dev server

Once running, open:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/health`

---

## Project Structure

```
Coffery/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/              # Route-level components
│   │   │   ├── Home.tsx
│   │   │   ├── Menu.tsx
│   │   │   └── NotFound.tsx
│   │   ├── services/
│   │   │   └── api.ts          # Axios instance (auth headers, 401 redirect)
│   │   └── hooks/
│   │       └── useSocket.ts    # socket.io-client hook
│   ├── .env.example
│   ├── tailwind.config.js
│   └── vite.config.ts          # Proxies /api → localhost:8080
│
├── backend/                    # Go + Gin API
│   ├── cmd/server/main.go      # Entry point
│   ├── internal/
│   │   ├── config/             # Loads config from environment variables
│   │   ├── database/           # GORM connection + AutoMigrate
│   │   ├── handlers/           # HTTP handlers (auth, menu, health)
│   │   ├── middleware/         # JWT auth guard, CORS
│   │   └── models/             # GORM models (User, MenuItem, Order, OrderItem)
│   ├── go.mod
│   └── .env.example
│
├── docker-compose.yml          # PostgreSQL service
├── Makefile                    # Dev commands
└── .gitignore
```

---

## Makefile Commands

| Command | Description |
|---|---|
| `make install` | Install all frontend and backend dependencies |
| `make dev` | Start Postgres, frontend, and backend together |
| `make db` | Start only the Postgres container |
| `make db-stop` | Stop the Postgres container |
| `make db-reset` | Wipe the database volume and restart fresh |
| `make build` | Build the frontend (`dist/`) and Go binary (`backend/bin/server`) |
| `make test` | Run all Go tests |
| `make lint` | Run ESLint (frontend) and `go vet` (backend) |

---

## Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Set to `production` to enable Gin release mode |
| `PORT` | `8080` | Port the API server listens on |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5433` | Postgres port (5433 to avoid conflicts with local Postgres) |
| `DB_USER` | `coffery` | Postgres username |
| `DB_PASSWORD` | `coffery_secret` | Postgres password |
| `DB_NAME` | `coffee_shop` | Postgres database name |
| `DB_SSLMODE` | `disable` | SSL mode for Postgres connection |
| `JWT_SECRET` | `change_me_in_production` | Secret key for signing JWT tokens — **change this in production** |
| `JWT_EXPIRY_HOURS` | `72` | How long JWT tokens are valid (in hours) |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL for API requests |
| `VITE_SOCKET_URL` | `http://localhost:8080` | Base URL for WebSocket connections |

> Note: The Vite dev server also proxies `/api/*` to `localhost:8080` automatically, so direct API calls from the browser during development don't hit CORS issues.

---

## Tech Stack

### Frontend

| Package | Purpose |
|---|---|
| [React 18](https://react.dev) | UI library |
| [Vite 6](https://vitejs.dev) | Build tool and dev server with HMR |
| [TypeScript](https://www.typescriptlang.org) | Type-safe JavaScript |
| [react-router-dom v6](https://reactrouter.com) | Client-side routing (`<Routes>`, `<Link>`, etc.) |
| [axios](https://axios-http.com) | HTTP client with request/response interceptors |
| [socket.io-client](https://socket.io/docs/v4/client-api/) | WebSocket client for real-time features |
| [Tailwind CSS v3](https://tailwindcss.com) | Utility-first CSS framework |

### Backend

| Package | Purpose |
|---|---|
| [Gin](https://gin-gonic.com) | HTTP web framework (routing, middleware, binding) |
| [GORM](https://gorm.io) | ORM for database access and migrations |
| [gorm postgres driver](https://gorm.io/docs/connecting_to_the_database.html#PostgreSQL) | GORM driver for PostgreSQL |
| [golang-jwt/jwt v5](https://github.com/golang-jwt/jwt) | JWT token generation and validation |
| [godotenv](https://github.com/joho/godotenv) | Load `.env` files into environment variables |
| [golang.org/x/crypto](https://pkg.go.dev/golang.org/x/crypto) | `bcrypt` for password hashing |

### Infrastructure

| Tool | Purpose |
|---|---|
| [PostgreSQL 16](https://www.postgresql.org) | Primary relational database |
| [Docker / Docker Compose](https://docs.docker.com/compose/) | Runs Postgres in an isolated container |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/menu` | No | List available menu items (filter by `?category=`) |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login and receive a JWT token |
| `GET` | `/api/me` | JWT | Get the currently authenticated user |

---

## Notes

- **Database migrations** run automatically when the backend starts via GORM `AutoMigrate`.
- **Port 5433** is used for Docker Postgres (instead of the default 5432) to avoid conflicts if you have a local Postgres instance running.
- **JWT tokens** are stored in `localStorage` on the frontend and sent as `Authorization: Bearer <token>` headers.
- **Passwords** are hashed with bcrypt before being stored — plain-text passwords are never saved.
