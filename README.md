# Conexa Movies Challenge

A Star Wars movie management backend built with NestJS for the Conexa Backend
Engineer technical challenge. It exposes JWT-authenticated, role-based CRUD
for movies, per-user favorites, and an admin-only sync job that ingests the
public [Star Wars API (SWAPI)](https://swapi.info/) catalog (planets,
characters, species, starships, vehicles and films) into a Postgres database.

See [`CHALLENGE.md`](./CHALLENGE.md) for the original assignment brief (in
Spanish) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the reasoning behind
the non-obvious design decisions.

## Tech stack

- **[NestJS](https://nestjs.com/) 12** (`@nestjs/common`, `core`,
  `platform-express`) — application framework
- **TypeScript 6**, ESM (`"type": "module"`)
- **PostgreSQL** + **TypeORM 1.1** (`@nestjs/typeorm`, `pg`) — persistence,
  with hand-written migrations (no `synchronize`)
- **[Zod 4](https://zod.dev/)** — request validation via NestJS's native
  Standard Schema pipe (`StandardSchemaValidationPipe`), no separate
  `class-validator` layer
- **JWT auth** — `@nestjs/jwt` + `bcrypt` for password hashing
- **`@nestjs/swagger`** — OpenAPI docs, fed directly from the same Zod
  schemas used for validation (see `src/common/openapi/zod-schema.util.ts`)
- **`@nestjs/schedule`** — daily cron job for the SWAPI sync
- **`@nestjs/axios`** — HTTP client used to call SWAPI
- **`helmet`** — baseline HTTP security headers
- **[Vitest 4](https://vitest.dev/)** (`@vitest/coverage-v8`) — unit and e2e
  tests
- **[oxlint](https://oxc.rs/docs/guide/usage/linter.html)** — linting
- **pnpm** — package manager

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` \| `production` \| `test` (defaults to `development`) |
| `PORT` | HTTP port the app listens on (defaults to `3000`) |
| `DATABASE_HOST` | Postgres host (e.g. `localhost`) |
| `DATABASE_PORT` | Postgres port (defaults to `5432`) |
| `DATABASE_USER` | Postgres user |
| `DATABASE_PASSWORD` | Postgres password |
| `DATABASE_NAME` | Postgres database name |
| `JWT_SECRET` | Secret used to sign/verify access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `1d`) |
| `ADMIN_EMAIL` | Email for the first admin account, used by the seed script and by the sync cron to attribute scheduled writes |
| `ADMIN_PASSWORD` | Password for the first admin account, used by the seed script (must satisfy the same password policy as signup) |

All variables are validated on boot by `src/config/env.validation.ts`; the
app refuses to start if any required one is missing or malformed.

### 3. Start Postgres

A ready-to-use `docker-compose.yml` is included:

```bash
docker compose up -d
```

### 4. Run migrations

```bash
pnpm migration:run
```

### 5. Seed the first admin account

```bash
pnpm seed
```

This is idempotent — running it again when `ADMIN_EMAIL` already exists is a
no-op. See [How to get an admin account](#how-to-get-an-admin-account) below
for why this script is the *only* way to create one.

### 6. Start the app

```bash
pnpm start:dev
```

The app boots on `http://localhost:<PORT>` (default `3000`).

## Running tests

```bash
pnpm test          # unit tests (vitest run, *.spec.ts)
pnpm test:cov       # unit tests with coverage
pnpm test:e2e       # end-to-end tests (*.e2e-spec.ts, separate vitest config)
pnpm test:watch     # unit tests in watch mode
```

Both vitest configs (`vitest.config.ts` and `vitest.config.e2e.ts`) exclude
`**/.claude/**` from file discovery, so agent worktrees created under
`.claude/` don't get picked up as test files.

## API documentation

Once the app is running, Swagger UI is available at:

```
http://localhost:<PORT>/api/docs
```

The raw OpenAPI document is served as JSON at `/api/docs-json`.

Every route except `POST /auth/signup` and `POST /auth/login` requires a
bearer token. Obtain one by logging in:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@conexa.ai","password":"<your-password>"}'
```

Then pass the returned `accessToken` as `Authorization: Bearer <token>` on
subsequent requests (or via the "Authorize" button in Swagger UI).

## API overview

| Resource | Endpoints | Access |
| --- | --- | --- |
| **Auth** (`/auth`) | `POST /signup`, `POST /login` | Public |
| | `GET /me` | Any authenticated user |
| **Users** (`/users`) | `PATCH /:id/role` | Admin only (`users:manage_role`) |
| **Movies** (`/movies`) | `GET /`, `GET /:id`, `GET /:id/characters`, `GET /:id/planets`, `GET /:id/species`, `GET /:id/starships`, `GET /:id/vehicles` | Any authenticated user |
| | `POST /`, `PATCH /:id`, `DELETE /:id` | Admin only (`movies:write`) |
| | `POST /movies/sync` | Admin only (`movies:sync`) — triggers a full SWAPI catalog sync |
| **Favorites** (`/favorites`) | `POST /:movieId`, `DELETE /:movieId`, `GET /` | Any authenticated user, scoped to their own favorites |

Characters, planets, species, starships and vehicles have no standalone
endpoints of their own — they're populated exclusively by the SWAPI sync and
exposed only as read-only nested routes under `/movies/:id/...` (see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for why).

The SWAPI sync also runs automatically once a day via a cron job
(`@nestjs/schedule`), attributed to the admin identified by `ADMIN_EMAIL`.

## How to get an admin account

There is no HTTP endpoint that creates an admin:

- `POST /auth/signup` always creates the user with `Role.USER` — any
  client-supplied `role` field is silently discarded (the signup schema
  doesn't declare one).
- `PATCH /users/:id/role` (the only way to promote a user to admin) itself
  requires the `users:manage_role` permission, which only an existing admin
  holds.

This is intentionally a chicken-and-egg situation the seed script exists to
break: `pnpm seed` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the
environment and creates that one admin account directly, bypassing the
normal signup flow. Run it once after migrations; every admin after that is
created by an existing admin via `PATCH /users/:id/role`.
