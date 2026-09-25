# Architecture Decisions

This document lays out the non-obvious design decisions made in this
project, why they were made, and what the alternative would have been. It's
written to be defensible in a follow-up technical interview — each entry
states the tradeoff, not just the choice.

## 1. Permission-based RBAC with a fail-closed global guard

**Chosen:** Authorization is modeled as a `Permission` enum
(`movies:read`, `movies:write`, `movies:sync`, `users:manage_role`) mapped
from `Role` via `RolePermissions` (`src/auth/constants/role-permissions.mapping.ts`),
rather than checking `request.user.role === Role.ADMIN` inline in each
controller. Enforcement lives entirely in one global guard,
`PermissionsGuard` (`src/auth/guards/permissions.guard.ts`), registered as an
`APP_GUARD` in `app.module.ts` alongside the JWT `AuthGuard`.

Every route must carry exactly one of three decorators declaring its
authorization intent: `@Public()`, `@Permissions(...)`, or
`@AnyAuthenticatedUser()`. If a route has none of them, `PermissionsGuard`
throws `ForbiddenException` rather than allowing the request through. This
makes the guard **fail closed**: a route added later by a developer who
forgets to think about authorization is rejected at runtime instead of
silently becoming public.

**Alternative considered:** a simple `@Roles(Role.ADMIN)` decorator plus an
inline `role === 'admin'` check, or no guard at all with manual checks
inside each service method.

**Why not:** role checks scattered across services are easy to miss during
review and impossible to unit test in isolation from the rest of the
business logic. A role-only model also doesn't scale — the moment a third
role or a partial-admin capability shows up, every call site needs revisiting.
Permissions decouple "what can be done" from "who can do it": the guard
only ever asks "does this role's permission set satisfy what this route
requires," and `RolePermissions` is the single place that maps roles to
capabilities. The fail-closed default was the more important half of this
decision — it converts "authorization bug" from a silent security hole into
a loud 403 at request time, which is a much cheaper failure mode to catch in
review or in a smoke test.

## 2. Postgres + TypeORM migrations, not SQLite/in-memory

**Chosen:** A real PostgreSQL instance (via `docker-compose.yml`), TypeORM
with `synchronize: false`, and seven hand-written migrations under
`src/database/migrations/` applied through the CLI (`pnpm migration:run`).

**Alternative considered:** SQLite or an in-memory database for zero-setup
local development and faster test runs.

**Why not:** this challenge is explicitly evaluated on backend architecture
quality, and `synchronize: true` (schema auto-sync from entities) is a
footgun in anything resembling production — it can silently drop columns or
data on a mismatched entity change. Writing explicit migrations forces every
schema change to be reviewed and reversible (`migration:revert`), and using
Postgres locally means the schema, enum types (`user_role_enum`), and
constraints (unique `swapi_id`, composite primary keys on junction tables)
behave identically in dev and in whatever environment this gets deployed to.
The cost is a slightly heavier local setup (`docker compose up -d` before
anything else works), which `docker-compose.yml` makes a one-liner.

## 3. Zod validation via NestJS's native Standard Schema pipe, reused for Swagger

**Chosen:** All request validation goes through Zod schemas (e.g.
`createMovieSchema`, `loginSchema`) passed directly to `@Body({ schema })` /
`@Query({ schema })`, validated globally by NestJS's built-in
`StandardSchemaValidationPipe` (registered once in `main.ts`). No
`class-validator` / `class-transformer` DTOs exist anywhere in the codebase.

The same Zod schemas are then converted to OpenAPI 3.0 JSON Schema for
Swagger via `src/common/openapi/zod-schema.util.ts`, using Zod's own
built-in `z.toJSONSchema()` — no third-party Zod-to-OpenAPI bridge library
(e.g. `@anatine/zod-nestjs`, `zod-to-openapi`) was needed. `zodToOpenApiSchema`
wraps that call with `target: 'openapi-3.0'` and, importantly, `io: 'input'`
— because OpenAPI must describe what the *client* sends over the wire, not
the post-parsing runtime shape. This matters concretely for
`listMoviesQuerySchema`, which uses `z.coerce.number()` with defaults: the
client sends an optional query string, not a required number, and `io:
'input'` is what keeps the generated docs honest about that. A second
helper, `zodQueryParams`, derives one `@ApiQuery` per top-level property from
that same JSON Schema output, since OpenAPI has no "single query object"
concept the way it does for bodies.

**Alternative considered:** `class-validator` decorators on DTO classes (the
NestJS default), with a hand-maintained parallel set of `@ApiProperty()`
decorators for Swagger, or a dedicated Zod-OpenAPI library.

**Why not:** decorator-based DTOs mean the validation rules and the Swagger
docs are two separate sources of truth that can silently drift (a
`@ApiProperty()` that doesn't match its `@IsString()` sibling is a compile-time-invisible
bug). Funneling both through one Zod schema per endpoint means there is
exactly one place to update a field, and `zodToOpenApiSchema` guarantees the
docs can never describe something the validator doesn't actually enforce.
Standard Schema support landing natively in NestJS's pipe (no `nestjs-zod`
adapter package required) and Zod 4 shipping its own JSON Schema converter
made this possible without extra dependencies.

## 4. `swapiId` nullable only on `Movie`; required everywhere else — and why those "everywhere else" entities have no CRUD

**Chosen:** `Movie.swapiId` is `nullable: true` (`src/movies/entities/movie.entity.ts`).
Every other synced entity — `Planet`, `Character`, `Species`, `Starship`,
`Vehicle` — declares `swapiId!: string` as a required, unique column.

This mirrors two genuinely different creation paths:
- **Movies** have a dual origin: they arrive via the SWAPI sync
  (`MoviesService.upsertFromSwapi`, keyed on `swapiId`) *and* via manual
  admin authorship (`POST /movies`, `MoviesService.create`, which explicitly
  sets `swapiId: null` — see the comment in `create-movie.dto.ts`). A
  manually authored movie has no SWAPI origin, so the column must allow
  `null`.
- **Planets, characters, species, starships, vehicles** have exactly one
  origin: the sync. There is no `POST /planets`, no `PlanetsController` at
  all — `PlanetsModule` (and its four siblings) exports only a service,
  consumed internally by `SwapiSyncService`. Consequently `swapiId` is
  always populated and the column can be `NOT NULL`, which also gives the
  upsert conflict target (`conflictPaths: ['swapiId']` equivalent per
  entity) a real, enforced uniqueness guarantee instead of an assumed one.

Because those five entities are sync-only by design, they were deliberately
given **no standalone CRUD endpoints**. Exposing `POST /characters` or
`PATCH /planets/:id` would let an admin hand-edit data that the next
scheduled sync (or manual `POST /movies/sync`) will silently overwrite via
upsert — a confusing, inconsistent UX for no real benefit, since the
challenge's actual data-ownership model treats SWAPI as the source of truth
for that catalog data. Instead they're exposed exclusively as **read-only
nested routes** under their owning movie (`GET /movies/:id/characters`,
`/planets`, `/species`, `/starships`, `/vehicles`), which is the only way
the challenge's requirements actually need to consume that data.

**Alternative considered:** giving all catalog entities full CRUD for
symmetry with `Movie`.

**Why not:** symmetry for its own sake would have created a correctness
trap (admin edits silently clobbered by the next sync) and violated the
principle that an entity's write surface should match its actual source of
truth.

## 5. `Favorite` gets full CRUD despite that pattern

**Chosen:** `FavoritesController` exposes `POST /:movieId`, `DELETE
/:movieId`, and `GET /` — the one full read/write/delete surface outside of
`Movie` itself.

**Why:** `Favorite` is fundamentally different from the catalog entities in
decision #4 — it's **user-generated data**, not SWAPI-sourced. There is no
sync job that could ever overwrite a favorite, so there's no clobbering
risk, and the whole point of the feature is that a user can freely add and
remove entries. Every route is `@AnyAuthenticatedUser()` rather than
permission-gated, and the user id is always taken from the JWT
(`request.user.sub`), never from the request body or URL, so a user can only
ever create, list, or delete their *own* favorites — there is no
"favorites for user X" admin surface, deliberately, since nothing in the
challenge calls for one.

## 6. First-admin bootstrap via seed script; signup ignores client-supplied role

**Chosen:** `signupSchema` (`src/auth/dto/signup.dto.ts`) has no `role`
field at all, so Zod silently strips any `role` a client sends before
`AuthService.signup` ever sees the body — every self-registered user is
created as `Role.USER` by `UsersService.create`, which hardcodes that role
rather than accepting it as a parameter. The only way to create the first
admin is the standalone script `src/database/seeds/create-admin.seed.ts`
(`pnpm seed`), which boots a Nest application context, validates
`ADMIN_PASSWORD` against the exact same `passwordSchema` signup uses (so the
seed can't become a policy backdoor), and inserts the user directly through
the repository with `Role.ADMIN`.

**Alternative considered:** letting `signup` accept an optional `role`
field guarded by some other check, or a one-time "bootstrap admin" HTTP
endpoint that disables itself after first use.

**Why not:** any HTTP path that can produce an admin account is an attack
surface — an optional `role` field is one missed validation check away from
privilege escalation on signup, and a self-disabling bootstrap endpoint adds
state and complexity (how does it know it already ran? what stops a race
between two concurrent calls?) to solve a problem a deploy-time script
solves for free. The seed script is idempotent (no-ops if `ADMIN_EMAIL`
already exists) and safe to run on every deploy, and every admin *after*
the first is created through the normal, permission-checked `PATCH
/users/:id/role` flow — there is exactly one bootstrap path, and it never
touches the HTTP layer.

## 7. SWAPI sync is additive-only; stale relations are never pruned

**Known limitation, accepted as-is.** `SwapiSyncService` (and the per-entity
`upsertFromSwapi` methods it calls) only ever `upsert`s rows keyed by
`swapiId` and `insert`s (or upserts) junction rows for movie relations
(`MoviesService.linkRelations`). Nothing in the sync path deletes a
`Planet`, `Character`, `Movie`, or a `movie_*` junction row that used to
exist but is no longer present in the latest SWAPI response.

This is a real gap: if SWAPI ever removed an entity or a film dropped a
character, that stale row (and its junction links) would remain in this
database forever, silently diverging from the upstream source of truth.

**Why this was accepted rather than fixed:** SWAPI's public dataset is
static — it mirrors six fixed films and their canon characters/planets/etc.,
and in practice never removes entries. Building a correct prune step (diff
the full remote id set against the local one, cascade-delete or soft-delete
orphaned junction rows without breaking a user's existing `Favorite`
records that point at a movie) is real, non-trivial work whose risk is not
proportional to its benefit against a dataset that doesn't change shape.
Doing it properly would also need decisions this challenge doesn't ask for
(hard delete vs. soft delete a `Movie` a user has favorited?). Flagging it
here rather than silently shipping it is the honest tradeoff.

## 8. Movies list pagination with a sort-field whitelist

**Chosen:** `GET /movies` is paginated (`page`, `limit`, capped at 100) and
sortable, but `sortBy` is constrained to a `z.enum` over a fixed tuple,
`MOVIE_SORT_FIELDS = ['title', 'releaseDate', 'episodeId', 'createdAt']`
(`src/movies/dto/list-movies-query.dto.ts`). `MoviesService` then maps that
already-validated value through a second whitelist,
`SORT_COLUMNS: Record<MovieSortField, keyof Movie>`, before it ever reaches
TypeORM's `order` clause.

**Alternative considered:** accepting an arbitrary `sortBy: string` and
passing it straight into `order: { [sortBy]: order }`.

**Why not:** letting a raw client-controlled string become an `ORDER BY`
column name is SQL-injection-adjacent even through an ORM, and at minimum
lets a client trigger a query error (or a full table scan on an unindexed
column) by naming an arbitrary/nonexistent column. Validating at the Zod
layer is necessary but the `SORT_COLUMNS` mapping in the service is a
deliberate second, defense-in-depth check — the comment in the code is
explicit that the service should stay safe even if it's ever called from
somewhere other than the HTTP layer (a future internal caller, a test, a
GraphQL resolver later), rather than trusting that every future call site
remembers to validate first.
