# Proposal: Movies Challenge Completion

## Context

This repository is a portfolio submission for the Conexa Backend Engineer
technical challenge (NestJS). The brief (`CHALLENGE.md`) asks for a movies
API built on top of the public Star Wars API (SWAPI): JWT authentication,
role-based access control, movie CRUD backed by data synced from SWAPI, and
a favorites feature.

There was no pre-existing codebase to extend — this change is the entire
build, from an empty NestJS scaffold to a documented, tested, deployable
API. Given the size, the work was executed in sequential phases, each one
independently verified (lint, build, test, and a manual boot check) before
moving to the next, rather than as a single undifferentiated implementation
pass.

## What this change covers

- Auth: signup/login, JWT issuance, bcrypt password hashing, password
  policy validation.
- A fail-closed, permission-based RBAC system enforced by a single global
  guard.
- Movies, Characters, Planets, Species, Starships and Vehicles domains,
  populated from SWAPI via both an admin-triggered endpoint and a daily
  cron job.
- Full CRUD for Movies (admin-writable) and for Favorites (user-writable,
  since favorites are genuinely user-generated data rather than synced
  catalog data).
- Read-only nested browsing of a movie's related characters/planets/
  species/starships/vehicles.
- Pagination with full metadata and whitelisted sorting on the movies list.
- An idempotent seed script to bootstrap the very first admin account.
- Swagger/OpenAPI documentation generated from the same Zod schemas that
  validate requests at runtime.
- This `openspec/` archive plus `AGENTS.md` and a pointer `CLAUDE.md`,
  documenting the decisions and phase history for future maintainers
  (human or AI).

## Out of scope (explicitly, not silently dropped)

- Real deployment (Docker Compose is provided for local Postgres only).
- Caching of SWAPI responses.
- Pruning of stale synced relations when SWAPI's upstream data changes
  (see `design.md` — accepted limitation, low risk given SWAPI is a
  static public dataset).

## Verification approach

Each phase was verified before being considered done: `pnpm lint`,
`pnpm build`, `pnpm test`, and (for phases that changed runtime wiring,
such as the RBAC rework or Swagger bootstrap) a manual application boot to
confirm the module graph still resolves. See `tasks.md` for the phase-by-
phase breakdown and `design.md` for the architecture decisions made along
the way.
