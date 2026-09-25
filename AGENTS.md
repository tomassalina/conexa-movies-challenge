# AGENTS.md

Instructions for any AI coding agent (Claude Code, or any other tool that
reads `AGENTS.md`) working on this repository. This file is the canonical,
tool-agnostic source — `CLAUDE.md` at the repo root just points here.

## What this is

A NestJS backend for the Conexa Backend Engineer technical challenge: a
Star Wars movies API backed by SWAPI (the public Star Wars API), with JWT
auth, role-based access control, movie CRUD, per-user favorites, and a
sync job that ingests SWAPI's catalog. See `CHALLENGE.md` for the original
requirements, `ARCHITECTURE.md` for the full design writeup, and
`openspec/changes/movies-challenge-completion/` for the phase-by-phase
history of how this was built and why.

## Stack

- NestJS 12, TypeScript, ESM (`"type": "module"` in `package.json`).
- Postgres via TypeORM (migrations, not `synchronize: true`).
- Zod for runtime validation.
- Vitest for tests.
- oxlint for linting.
- pnpm as the package manager.

## Commands

Run these from the repo root:

```bash
pnpm install              # install dependencies
pnpm build                # nest build
pnpm start:dev             # nest start --watch
pnpm lint                 # oxlint src/ test/
pnpm test                 # vitest run (unit/integration specs, *.spec.ts)
pnpm test:watch            # vitest, watch mode
pnpm test:cov              # vitest run --coverage
pnpm test:e2e              # vitest run --config ./vitest.config.e2e.ts (*.e2e-spec.ts)
pnpm migration:generate    # tsx typeorm cli migration:generate -d src/database/data-source.ts
pnpm migration:run         # tsx typeorm cli migration:run
pnpm migration:revert      # tsx typeorm cli migration:revert
pnpm seed                  # tsx src/database/seeds/create-admin.seed.ts
```

Before considering any change done: `pnpm lint`, `pnpm build`, and
`pnpm test` must all pass clean. That was the bar used for every phase of
this project (see `openspec/changes/movies-challenge-completion/tasks.md`)
and it should stay the bar going forward.

Local Postgres for development is provided via `docker-compose.yml`. Copy
`.env.example` to `.env` and fill in real values before running migrations
or seeding.

## Permission system (read this before adding any route)

Every route handler MUST carry exactly one of these three decorators
(`src/auth/decorators/`):

- `@Public()` — no JWT required.
- `@Permissions(...permissions: Permission[])` — requires a JWT and every
  listed permission.
- `@AnyAuthenticatedUser()` — requires a JWT, no specific permission.

A route with **none** of these throws `ForbiddenException` at request
time — the system fails closed, on purpose. This is enforced by a single
global guard (`src/auth/guards/permissions.guard.ts`, registered as
`APP_GUARD` in `src/app.module.ts`), not by anything per-controller. If you
add a new controller method and forget the decorator, it will 403 in
tests/manual checks rather than silently being open — that's the intended
failure mode, don't "fix" it by making the guard permissive.

- `Permission` values live in `src/auth/enums/permission.enum.ts`.
- Role → permission mapping lives in
  `src/auth/constants/role-permissions.mapping.ts`.

Adding a new permission means: add it to the `Permission` enum, add it to
the roles that should have it in `RolePermissions`, then use
`@Permissions(Permission.YOUR_NEW_ONE)` on the route.

## Validation convention

Use **Zod schemas** validated through NestJS's native Standard Schema pipe
(`StandardSchemaValidationPipe`, wired globally in `src/main.ts`). Do
**not** use `class-validator`/`class-transformer` decorators, and do
**not** add the third-party `nestjs-zod` package — this project uses
NestJS's own built-in Standard Schema support directly.

If a schema needs to show up in Swagger, don't hand-write a duplicate
shape — feed the same Zod schema through `zodToOpenApiSchema` /
`zodQueryParams` in `src/common/openapi/zod-schema.util.ts`. One schema is
the source of truth for both runtime validation and API docs.

## Testing convention

- Vitest with `globals: true` (see `vitest.config.ts`) — do **not** import
  `describe`/`it`/`expect`/`vi`, they're global.
- TypeORM repositories are mocked as plain objects of `vi.fn()`s, not with
  a testing-module DI container — keep tests fast and dependency-free.
- Canonical example to copy the pattern from:
  `src/auth/guards/permissions.guard.spec.ts` (mocks `Reflector` as
  `{ getAllAndOverride: vi.fn(...) }`, builds a minimal fake
  `ExecutionContext` by hand).
- Unit specs live next to the code as `*.spec.ts` and run via `pnpm test`.
  E2E specs are `*.e2e-spec.ts` and run via `pnpm test:e2e` — these are
  separate Vitest configs (`vitest.config.ts` vs `vitest.config.e2e.ts`)
  on purpose; don't merge them.

## Commit convention

- Conventional Commits (`feat(scope): ...`, `fix(scope): ...`,
  `test(scope): ...`, `docs: ...`, etc.) — check `git log --oneline` for
  the exact style already in use before writing a new one.
- No AI attribution lines in commit messages.
- Commit in work-unit-scoped commits as you go (e.g. one commit for a
  service, another for its controller, another for its tests) rather than
  one giant commit per feature — that's how every phase of this project
  was actually committed; look at the git history for the pattern.

## Operational safety lessons (learned the hard way this session — read before repeating them)

1. **Never leave a long-running Nest process backgrounded without killing
   it and confirming.** `node dist/main.js` or `nest start --watch` left
   running in the background, forgotten, and relaunched repeatedly is not
   a hypothetical: this exact project once had **11 leaked watch
   processes** exhaust the whole machine's file descriptor table. If you
   background a dev server or watch process, kill it when you're done and
   confirm with `pgrep -fl nest` (or similar) that nothing is left over —
   don't just assume the shell cleaned it up. **A `pgrep -f` pattern that
   includes the absolute repo path (e.g. `conexa-movies-challenge/dist/main`)
   will silently miss a process launched with a relative path (`node
   dist/main.js`)** — this happened twice this session, leaving a real
   leaked process behind a "cerrado ok" false confirmation. Prefer
   capturing the exact PID at launch time (`command & PID=$!`) over
   pattern-matching after the fact, or use a narrower, path-independent
   pattern like `pgrep -f "dist/main.js"`.

2. **Don't touch the `.claude/**` exclusion in `vitest.config.ts` /
   `vitest.config.e2e.ts`.** It's there so that running tests while an
   agent worktree exists under `.claude/worktrees/` doesn't silently
   aggregate that worktree's `*.spec.ts` files into your test run. Removing
   it doesn't fail loudly — it just quietly runs (and reports on) tests
   that don't belong to the branch you're working on.

3. **Git worktrees**: if `main` has moved since your worktree branch was
   created, rebase onto the latest `main` immediately before merging:
   ```bash
   git fetch <main-repo-path> main:main-ref
   git rebase main-ref
   ```
   And after merging any branch that touched `package.json` or
   `pnpm-lock.yaml`, run `pnpm install` — a merge alone does not update
   `node_modules`, and skipping this step produces confusing "works on one
   branch, broken on another" failures that look like real bugs.

4. **Never create, delete, or overwrite `.env` in the primary working
   directory — not even "if you created it yourself."** This happened
   twice this session: an agent (or the orchestrator) reasoned "I created
   this `.env` for my own boot check, so I'll clean it up when done," and
   ended up deleting or clobbering the developer's real, already-configured
   `.env` instead — because that self-check ("did I create this?") is
   unreliable in practice. The fix is not a better check, it's not doing
   this at all: if you need env vars to boot the app for a verification
   step, do it inside an isolated git worktree (its `.env` is a genuinely
   separate file on disk from the main checkout's), or ask the user to
   confirm `.env` is set up rather than touching it yourself. A stray
   `.env` left behind is harmless (it's gitignored); overwriting or
   deleting the real one is not.

5. **Never configure a compound shell command (`sh -c "a && b"`) as a raw
   string through a deploy platform's API/UI field.** This project's
   production entrypoint needs to run migrations before starting the
   server, and the first attempt at this — passing
   `sh -c "migration-command && node dist/main.js"` as a JSON string field
   on the Dokploy application config — broke in production with
   `Syntax error: Unterminated quoted string`, because the nested quoting
   didn't survive JSON encoding → API → the platform's own command
   parsing intact. Fixed by moving the whole sequence into a committed,
   executable script (`scripts/start-prod.sh`) and pointing the platform's
   startup command at that script instead (`sh scripts/start-prod.sh`) —
   zero nested quoting, and the actual startup logic is versioned in the
   repo instead of hidden in a platform's dashboard/API config.

## Where to find deeper context

- `ARCHITECTURE.md` — full design decisions and rationale.
- `openspec/changes/movies-challenge-completion/` — the complete phase
  history (`proposal.md`, `design.md`, `tasks.md`) for how this codebase
  was actually built, in order, with what was verified at each step.
- `CHALLENGE.md` — the original challenge requirements this repo is
  answering.
