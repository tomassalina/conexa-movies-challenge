# Tasks: Movies Challenge Completion

Phase plan as actually executed. Each phase was verified independently
(lint/build/test, plus a manual boot check for phases touching runtime
wiring) before the next phase began.

- [x] **Fase 1 — Auth foundation**
  Auth module, JWT issuance/verification, bcrypt password hashing +
  password policy validation, user roles (`Role.USER` / `Role.ADMIN`).

- [x] **Fase 2 — Permission system rework (fail-closed)**
  Replaced the earlier, more permissive authorization approach with the
  `Permission` enum + `RolePermissions` mapping + `@Public()` /
  `@Permissions(...)` / `@AnyAuthenticatedUser()` decorators, enforced by a
  single global `PermissionsGuard` centralized in `AppModule` via
  `APP_GUARD`. A route with none of the three decorators now 403s instead
  of being silently reachable.

- [x] **Fase 3 — SWAPI sync**
  Sync for movies plus the full catalog (characters, planets, species,
  starships, vehicles). Both an admin-triggered `POST /movies/sync`
  endpoint and a scheduled daily cron (`@Cron(EVERY_DAY_AT_MIDNIGHT)`).
  Full test coverage including the HTTP client layer (SWAPI pagination and
  error handling, `HttpService` mocked).

- [x] **Fase 4 — Movies CRUD**
  Full CRUD on `Movie` (admin-writable), pagination with total/totalPages/
  hasNextPage/hasPreviousPage metadata, sorting restricted to a whitelisted
  column set, and read-only nested relation browsing routes
  (`GET /movies/:id/{characters,planets,species,starships,vehicles}`).

- [x] **Fase 5 — Admin bootstrap**
  Idempotent seed script (`pnpm seed`, `src/database/seeds/create-admin.seed.ts`)
  reading `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env, enforcing the same
  password policy as signup, no-op if the admin already exists.

- [x] **Fase 6 — `auth.service` test coverage**
  Unit tests for signup/login flows, password hashing, and role hardcoding
  on signup (`src/auth/auth.service.spec.ts`).

- [x] **Fase 7 — API documentation**
  Swagger/OpenAPI docs served at `/api/docs`, generated from the existing
  Zod schemas via a native bridge (`zodToOpenApiSchema` / `zodQueryParams`
  in `src/common/openapi/zod-schema.util.ts`) instead of hand-duplicated
  DTOs, plus bearer-auth wiring in the Swagger config.

- [x] **Fase 8 — Documentation (this phase)**
  README rewrite, `ARCHITECTURE.md` (both owned by a parallel agent — not
  part of this change's file set), this `openspec/` archive, and
  `AGENTS.md` / root `CLAUDE.md` pointer file.

- [x] **Favorites CRUD** (done out of the original phase order, once the
  movies domain existed to favorite against)
  Full CRUD, unlike every other synced domain, because favorites are
  genuinely user-generated data rather than SWAPI catalog data (see
  `design.md`, decision 5).

- [ ] **Remaining / explicitly out of scope for now**
  - Real deployment (only local Docker Compose for Postgres exists today).
  - Caching of SWAPI responses.
  - Pruning of stale synced relations (see `design.md`, decision 8 —
    accepted limitation, not a bug).
