# Design: Movies Challenge Completion

Architecture decisions actually made and implemented in this codebase, with
the reasoning behind each one and where to find it in code.

## 1. Fail-closed, permission-based RBAC

- `Permission` enum (`src/auth/enums/permission.enum.ts`): `movies:read`,
  `movies:write`, `movies:sync`, `users:manage_role`.
- `RolePermissions` mapping (`src/auth/constants/role-permissions.mapping.ts`):
  a `Record<Role, Permission[]>` — `USER` gets `movies:read`, `ADMIN` gets
  all four.
- Three route-level decorators, mutually exclusive in intent
  (`src/auth/decorators/`): `@Public()`, `@Permissions(...permissions)`,
  `@AnyAuthenticatedUser()`.
- A single global `PermissionsGuard` (`src/auth/guards/permissions.guard.ts`),
  registered via `APP_GUARD` in `src/app.module.ts` alongside `AuthGuard`
  (order matters: `AuthGuard` populates `request.user` before
  `PermissionsGuard` reads `request.user.role`).

The guard **fails closed**: if a route carries none of the three decorators,
it throws `ForbiddenException` rather than defaulting to open or to
"any authenticated user." This was a deliberate rework (see git history:
`ba83dfd fix(swapi): reconcile with renamed permissions API`) from an
earlier, more permissive design, because a permission system that lets a
future route slip through unprotected by omission is a security bug waiting
to happen — an explicit `ForbiddenException` at review/QA time is a much
cheaper failure mode than a silently-open endpoint in production.

Precedence when a route carries more than one decorator: `@Public()` >
`@Permissions(...)` > `@AnyAuthenticatedUser()`.

## 2. Postgres + TypeORM migrations (not SQLite / in-memory)

The app runs against real Postgres (`TypeOrmModule.forRootAsync` in
`app.module.ts`, `synchronize: false`), with migrations managed through
TypeORM's CLI (`pnpm migration:generate` / `migration:run` /
`migration:revert`, `src/database/data-source.ts`). This was chosen over
SQLite or an in-memory store specifically to exercise the same
migration-driven workflow a real production service would use, rather than
a toy setup that would need to be redone before going live.

## 3. Zod validation via NestJS's native Standard Schema pipe, reused for Swagger

- `app.useGlobalPipes(new StandardSchemaValidationPipe())` in `src/main.ts`
  — NestJS's own Standard Schema pipe, not `class-validator` and not the
  third-party `nestjs-zod` package.
- The same Zod schemas are later fed into `z.toJSONSchema()`
  (`src/common/openapi/zod-schema.util.ts`, `zodToOpenApiSchema` /
  `zodQueryParams`) to generate the Swagger/OpenAPI documentation.

One schema is the source of truth for both runtime validation and API
documentation — there is no separate, hand-maintained DTO/shape definition
for Swagger that could drift from what the pipe actually validates.

## 4. `swapiId` nullable only on `Movie`

`Movie.swapiId` is `string | null` (nullable). `Character.swapiId`,
`Planet.swapiId`, `Species.swapiId`, `Starship.swapiId`, and
`Vehicle.swapiId` are all required (`!: string`, NOT NULL).

Reason: `Movie` is the only entity with a dual creation path — it can come
from the SWAPI sync **or** be created manually by an admin via
`POST /movies`. The other five entities are sync-only; there is no manual
CRUD for them. Making `swapiId` required on the sync-only entities encodes
that invariant at the schema level instead of leaving it as an unenforced
convention, and avoids an unrequested "SWAPI sync vs. manual edit conflict"
problem that manual CRUD on those entities would introduce. Their data is
still fully reachable — just read-only, via nested routes under movies
(`GET /movies/:id/characters`, `/planets`, `/species`, `/starships`,
`/vehicles`, all `@AnyAuthenticatedUser()`).

## 5. `Favorite` gets full CRUD, breaking the "sync-only" pattern on purpose

Every other domain entity in this app is either sync-only (no manual write
path) or dual-path with a nullable `swapiId` (`Movie`). `Favorite` is
different: it isn't SWAPI data at all, it's genuinely user-generated —
"this user favorited this movie." It gets a real `FavoritesController` with
create/list/delete, scoped to the authenticated user
(`src/favorites/favorites.controller.ts`), because pretending it fits the
sync-only pattern would be wrong, not just inconsistent.

## 6. Idempotent first-admin bootstrap via seed script

`src/database/seeds/create-admin.seed.ts` (`pnpm seed`) reads
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment, validates the
password against the same `passwordSchema` signup uses, and no-ops if that
email already exists.

This exists because there is intentionally no HTTP path to create the first
admin: `AuthService.signup` (via `UsersService.create`) always hardcodes
`role: Role.USER`, regardless of any `role` field a client might send in
the request body — a signup endpoint that trusted a client-supplied role
would let anyone self-promote to admin. Promoting a user to `Role.ADMIN`
happens through `PATCH /users/:id/role`, which itself requires
`Permission.USERS_MANAGE_ROLE` — a permission only `ADMIN` already holds.
Without the seed script, the app could never bootstrap its first admin at
all.

## 7. Movies list pagination with full metadata + whitelisted sorting

`GET /movies` (`src/movies/movies.service.ts`) returns `total`,
`totalPages`, `hasNextPage`, and `hasPreviousPage` alongside the page of
results, computed from `page`/`limit`.

Sorting is restricted to a fixed whitelist: `list-movies-query.dto.ts`
declares `MOVIE_SORT_FIELDS` as a Zod enum, and `movies.service.ts` maps
each allowed `sortBy` value through a `SORT_COLUMNS` lookup to the real
column name before it ever reaches the TypeORM query builder. A client
value that isn't in the enum is rejected by validation before it gets
anywhere near a query; a value that is in the enum still goes through the
`SORT_COLUMNS` lookup rather than being interpolated directly. This is a
deliberate defense against unsafe client-controlled `ORDER BY` — the
client can never make an arbitrary string reach `ORDER BY`.

## 8. Known, accepted limitation: SWAPI sync is additive-only

`SwapiSyncService` (`src/swapi/swapi-sync.service.ts`) calls
`upsertFromSwapi(...)` for every entity type on every sync run (manual or
cron) — it only ever creates or updates rows that SWAPI currently reports.
It never deletes or "prunes" rows that a previous sync created but that a
later SWAPI response no longer includes.

This is a deliberately accepted limitation, not an oversight: SWAPI is a
small, static, public reference dataset that in practice does not shrink
or remove entries. The risk of stale rows accumulating is low, and
documenting it honestly here (and in `AGENTS.md`/`ARCHITECTURE.md`) was
judged better than silently leaving it as an unstated gap. A real
production sync against a live-changing upstream would need a
reconciliation/pruning pass; this one doesn't have it.

## 9. Soft-delete on `Movie` removal

`MoviesService.remove` calls `this.moviesRepository.softDelete(id)`
(`src/movies/movies.service.ts`), which sets `deletedAt` via the
`@DeleteDateColumn` on `AuditableEntity` (`src/database/auditable.entity.ts`)
rather than issuing a hard `DELETE`. TypeORM's standard finders
automatically exclude soft-deleted rows, so callers don't need to filter
`deletedAt IS NULL` themselves. `AuditableEntity` also tracks `createdBy`/
`updatedBy`/`deletedBy` (all `NOT NULL` except `deletedBy`, which is only
set once a delete happens), giving every catalog row (movies, characters,
planets, species, starships, vehicles) a full audit trail attributable to
either an authenticated admin or the seeded admin (for sync writes).
Junction/link tables (`movie_*` and `favorites`) use the lighter
`CreatedAuditEntity` instead, since those rows are either replaced
wholesale by a re-sync or hard-deleted (unfavorite), never edited in place.

## 10. SWAPI Adapter classes; `SwapiService` scoped to HTTP/pagination only

`SwapiService` (`src/swapi/swapi.service.ts`) migrated from `swapi.dev` to
`swapi.tech` and now only fetches and paginates; the six raw-to-DTO
mappings it used to do inline were extracted into one Adapter class per
resource under `src/swapi/adapters/` (`PlanetAdapter`, `CharacterAdapter`,
`SpeciesAdapter`, `StarshipAdapter`, `VehicleAdapter`, `FilmAdapter`), all
implementing `SwapiAdapter<TRaw, TDto>` and independently unit tested. The
redundant outer `try/catch` in `SwapiService#get` was also dropped — the
RxJS `catchError` inside the `HttpService` pipe already converts every
failure to `ServiceUnavailableException`. `@nestjs/axios`'s `HttpService`
(and the RxJS `Observable`/`firstValueFrom` pattern that comes with it)
was kept rather than replaced with a plain promise-based client, since the
package's own README documents returning Observables as its intended
design, not a legacy artifact. See `ARCHITECTURE.md`, decision 9, for the
full reasoning and alternatives considered.

## 11. Production deployment: Dokploy-managed Postgres + Nixpacks, no Dockerfile

Deployed to a self-hosted Dokploy instance (Hostinger VPS) rather than a
managed PaaS like Railway/Render. The database is a Dokploy-managed
Postgres service, not the local `docker-compose.yml` Postgres used for
development — those are two separate instances by design, so local dev
data never touches production. The application itself builds via Nixpacks
(auto-detected from `package.json`, no Dockerfile committed) rather than a
hand-written Dockerfile — a Dockerfile was drafted and locally validated
first, but dropped once it was clear Nixpacks could build and run this
project without one, keeping the repo simpler. This required adding
`engines: {"node": ">=22"}` to `package.json`, since Nixpacks defaults to
Node 18 otherwise and a dependency needs Node 20+ regex syntax to build.
Database migrations don't run automatically under Nixpacks, so the
Dokploy application's startup command was overridden to run
`migration:run` before starting the server. See `ARCHITECTURE.md`,
decision 10.
