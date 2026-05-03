# Ledgers Backend

A small backend service for a multi-company financial platform. Built for the Ledgers technical assessment.

## Stack

- Node.js + Express
- MySQL (raw SQL via `mysql2/promise`)
- JWT auth (`jsonwebtoken`) and password hashing (`bcryptjs`)

## Project Structure

```
src/
  controllers/   request/response handlers
  routes/        endpoint definitions
  middleware/    auth (JWT), company access, error handling
  services/      business logic + SQL
  models/        mysql2 connection pool
  utils/         hashing and token helpers
db/
  schema.sql     database schema
server.js        process entry point
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Run the schema in `db/schema.sql`. From the MySQL CLI:

```bash
mysql -u root -p < db/schema.sql
```

Or paste the contents into phpMyAdmin and execute.

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```
PORT=3000

JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ledgers
```

### 4. Run the server

```bash
npm run dev    # with nodemon
# or
npm start
```

Server boots on `http://localhost:3000`. Health check: `GET /health`.

## API Reference

All authenticated routes expect `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/signup` | `{ email, password, name }` |
| POST | `/api/auth/login`  | `{ email, password }` |

Both return `{ token, user }`.

### Companies

| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/companies` | Lists companies the authenticated user belongs to |
| POST | `/api/companies` | Body: `{ name }`. Creator becomes `owner` |
| POST | `/api/companies/:id/members` | Body: `{ email }`. Owner-only |

### Transactions

| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/companies/:id/transactions` | Supports `?limit=&offset=` (default `limit=50`) |
| POST | `/api/companies/:id/transactions` | Body: `{ type, amount, occurred_on, description? }`. `type` is `revenue` or `expense` |

### Dashboard

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/companies/:id/dashboard` | `{ totalRevenue, totalExpenses, net }` |

## Sample curl flow

```bash
# ---- Signup ----
$response = Invoke-RestMethod -Method POST http://localhost:3000/api/auth/signup `
-Headers @{ "Content-Type" = "application/json" } `
-Body '{"email":"awab@example.com","password":"password123","name":"Awab"}'

$response
$env:TOKEN = $response.token

# ---- Create Company ----
Invoke-RestMethod -Method POST http://localhost:3000/api/companies `
-Headers @{ 
    "Authorization" = "Bearer $env:TOKEN"
    "Content-Type"  = "application/json"
} `
-Body '{"name":"Awab Inc"}'

# ---- Revenue ----
Invoke-RestMethod -Method POST http://localhost:3000/api/companies/1/transactions `
-Headers @{ 
    "Authorization" = "Bearer $env:TOKEN"
    "Content-Type"  = "application/json"
} `
-Body '{"type":"revenue","amount":1500,"occurred_on":"2026-05-01"}'

# ---- Expense ----
Invoke-RestMethod -Method POST http://localhost:3000/api/companies/1/transactions `
-Headers @{ 
    "Authorization" = "Bearer $env:TOKEN"
    "Content-Type"  = "application/json"
} `
-Body '{"type":"expense","amount":400,"occurred_on":"2026-05-01"}'

# ---- Dashboard ----
Invoke-RestMethod http://localhost:3000/api/companies/1/dashboard `
-Headers @{ "Authorization" = "Bearer $env:TOKEN" }

# =========================
# NEGATIVE TEST (Bob)
# =========================

# ---- Signup (Bob) ----
$bob = Invoke-RestMethod -Method POST http://localhost:3000/api/auth/signup `
-Headers @{ "Content-Type" = "application/json" } `
-Body '{"email":"bob@example.com","password":"password123","name":"Bob"}'

$env:BOB_TOKEN = $bob.token

# ---- Attempt Unauthorized Access ----
Invoke-RestMethod http://localhost:3000/api/companies/1/dashboard `
-Headers @{ "Authorization" = "Bearer $env:BOB_TOKEN" }
```

## Key Design Decisions

- **Layered architecture (routes → middleware → controllers → services → db).**
  Controllers are thin glue. All SQL and business rules live in services. This keeps each file short and makes the request flow easy to trace in a code review.

- **Raw SQL via `mysql2/promise` instead of an ORM.**
  Four tables and a handful of queries don't justify an ORM. Raw SQL is shorter, has zero magic, and is easier to defend out loud — what runs against the database is exactly what's in the file.

- **Many-to-many via a `user_companies` junction table with a `role` column.**
  Composite primary key `(user_id, company_id)` prevents duplicates. The `role` column (`owner` / `member`) lets the membership table double as authorization data — no separate roles table needed at this scope.

- **Company ownership enforced via middleware.**
  `companyAccess` runs before any per-company endpoint, looks up the user's row in `user_companies`, and blocks with 403 if absent. It also attaches `req.companyRole` so the rare owner-only routes (e.g. add member) can check without re-querying.

- **JWT in `Authorization: Bearer …` with `userId` in the payload.**
  Stateless, no session store. The middleware decodes the token and attaches `req.userId`; everything downstream uses that.

- **`DECIMAL(14, 2)` for money + `decimalNumbers: true` on the pool.**
  Floats lose pennies. `DECIMAL` is exact, and the pool option returns it as a JS number so dashboard sums don't need string parsing.

- **One error middleware, plain `Error` with a `.status` property.**
  Services throw `Error('msg')` with `err.status = 4xx`; controllers `next(err)`; middleware formats the response. No custom error class hierarchy because there's no payoff at this size.

- **Manual validation in controllers.**
  Presence, type, length checks are inline. A schema library (joi/zod) would be the right call as the surface grows, but it'd dwarf the actual logic here.

## Trade-offs / What's Intentionally Skipped

- No refresh tokens, no logout, no password reset, no email verification.
- No rate limiting, helmet, or structured logger — would add for production.
- No automated test suite; the curl flow above is the manual happy path.
- No migrations tooling — a single `schema.sql` is enough at this scope.
- Pagination is `limit`/`offset`. Cursor-based would be the upgrade once datasets grow.
- No input sanitisation library — parameterised queries handle SQL injection; XSS isn't relevant for a JSON API.

## How This Could Scale

- Add `helmet`, `express-rate-limit`, request logging (pino), and a health/readiness probe split for k8s.
- Move JWT secret + DB credentials into a secret manager (AWS Secrets Manager / Vault).
- Swap `limit`/`offset` for keyset pagination on `transactions` once the table is large.
- Introduce a migration tool (Knex / Prisma Migrate / Flyway) — schema changes via PRs, not ad-hoc SQL.
- Cache dashboard aggregates if requests get hot — Redis with a short TTL, invalidated on write.
- Split read replicas for the dashboard query path; keep the write path on the primary.
- Add audit logging on `transactions` (insert/update/delete) — financial data needs an immutable trail.
- For real RBAC, promote the `role` column into a proper permissions model (resource + action), still anchored in `user_companies`.
