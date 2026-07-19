# Coffery — System Requirements

Coffery is a full-stack cafe ordering system: customers order from their table via QR code, staff manage incoming orders in real time, and the boss manages the menu, staff accounts, and sales reports. It's split into a **Go/Gin backend** and a **React/Vite frontend**. Below are the requirements to build, run, and develop the project.

## 1. Development Environment

| Requirement | Version / Detail |
|---|---|
| OS | Windows, macOS, or Linux |
| Backend language | **Go 1.26.3** |
| Frontend runtime | **Node.js** (18+ recommended) |
| Frontend language | TypeScript 5.6 |
| Database | PostgreSQL (used via `DATABASE_URL`) |
| Package managers | `go mod` (backend), `npm` (frontend) |

## 2. Backend Requirements

| Setting | Value |
|---|---|
| Module | `cafe-app-backend` |
| Go version | 1.26.3 |
| Web framework | Gin (`gin-gonic/gin` v1.12.0) |
| Auth | JWT (`golang-jwt/jwt/v5` v5.2.1) + bcrypt (`golang.org/x/crypto`) |
| Database driver | `jackc/pgx/v5` (PostgreSQL) |
| WebSockets | `gorilla/websocket` |
| CORS | `gin-contrib/cors` |

## 3. Frontend Requirements

| Setting | Value |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS + custom CSS (no component library) |
| Routing | `react-router-dom` v6 (client-side, `BrowserRouter`) |
| Icons | Font Awesome (`@fortawesome/*`) |
| HTTP client | `axios` |
| QR code generation | `qrcode.react` |

## 4. External Services / Required Accounts

Two things are **not** committed to the repo and must be supplied via environment variables before the app will run correctly:

1. **A Render (or equivalent) Postgres database** — its connection string must be set as `DATABASE_URL` on the backend service. The app creates all required tables (`menu`, `transactions`, `users`) automatically on first startup.
2. **A signing secret and initial account** — set via environment variables on the backend host (see below). There is no hardcoded username/password anywhere in this codebase by design — without these set, no login accounts exist.

You'll therefore need:
- A **Render** account (or another host that supports a Go web service + a managed Postgres instance)
- Nothing else external — no third-party API keys, no Firebase, no Maps platform. The only integrations are your own database and your own frontend calling your own backend.

## 5. Required Environment Variables (Backend)

| Variable | Required? | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `PORT` | No (defaults to `8080`) | Set automatically by Render |
| `JWT_SECRET` | **Yes, for production** | Signs/validates login tokens. Falls back to an insecure dev-only string if unset — must be set to a long random value before real use |
| `SEED_BOSS_USERNAME` / `SEED_BOSS_PASSWORD` / `SEED_BOSS_NAME` | Only on first run | Creates the very first boss account. Safe to remove after that account exists — further accounts are created from inside the app itself |
| `SEED_STAFF_USERNAME` / `SEED_STAFF_PASSWORD` / `SEED_STAFF_NAME` | Optional | Same idea, for an initial staff account, if you don't want to create one manually via the app |

## 6. Library Dependencies

### Backend (Go)
| Library | Version |
|---|---|
| github.com/gin-gonic/gin | v1.12.0 |
| github.com/gin-contrib/cors | v1.7.7 |
| github.com/golang-jwt/jwt/v5 | v5.2.1 |
| github.com/gorilla/websocket | v1.5.3 |
| github.com/jackc/pgx/v5 | v5.10.0 |
| golang.org/x/crypto | v0.48.0 |

### Frontend (npm)
| Library | Version |
|---|---|
| react / react-dom | ^18.3.1 |
| react-router-dom | ^6.28.0 |
| axios | ^1.7.9 |
| qrcode.react | ^4.2.0 |
| @fortawesome/* | ^7.2.0 |
| vite | ^6.0.1 |
| typescript | ^5.6.3 |
| tailwindcss | ^3.4.15 |

## 7. App Roles

Coffery has three "sides" served from the same frontend, gated by login role:

- **Customer** (`/customer?table=N`) — no login required, browses the menu and places orders for a given table number
- **Staff** (`/staff`) — logs in, sees live incoming orders, marks them paid/cancelled
- **Boss** (`/dashboard`) — logs in, manages the menu, generates table QR codes, views sales reports, and creates/removes staff accounts

## 8. Deployment Notes

- Backend and frontend are deployed as **two separate services**: the backend as a Render **Web Service**, the frontend as a Render **Static Site** (build command `npm install && npm run build`, publish directory `dist`).
- Since the frontend uses client-side routing (`BrowserRouter`), the static site needs a **Rewrite rule** (`/*` → `/index.html`) in Render's Redirects/Rewrites settings, or direct links like `/customer?table=5` will 404.
- This is currently a **single-tenant** app — one deployment (one backend + one database) serves one cafe. Running it for multiple separate cafes means running multiple separate deployments; there's no built-in multi-tenancy (no `shop_id` scoping anywhere in the schema).

## 9. Summary — Minimum Setup Checklist

1. Install **Go 1.26.3+** and **Node.js 18+**.
2. Clone the repo.
3. Create a **PostgreSQL database** (e.g. a free Render Postgres instance) and note its connection string.
4. Deploy the backend (`/backend`) as a web service, setting `DATABASE_URL`, `JWT_SECRET`, and `SEED_BOSS_USERNAME`/`SEED_BOSS_PASSWORD` as environment variables.
5. Deploy the frontend (`/frontend`) as a static site, with a rewrite rule sending all paths to `/index.html`.
6. Log in as the seeded boss account, then create real staff accounts from the Boss dashboard's Staff tab.
7. Generate table QR codes from the Boss dashboard and print them for each table.

**Enjoy!!**
