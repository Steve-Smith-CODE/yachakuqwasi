<!--
Sync Impact Report
- Version change: (none, template) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections: Core Principles (I-VI), Technology Stack & Constraints,
  Development Workflow & Quality Gates, Governance
- Removed sections: none
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check gate is generic, compatible as-is)
  ✅ .specify/templates/spec-template.md (no principle-specific references to update)
  ✅ .specify/templates/tasks-template.md (task categories already align with layered/test-first principles)
  ✅ .claude/skills/speckit-*/SKILL.md (agent-agnostic, no references to update)
- Follow-up TODOs: none
-->

# YachakuqWasi Constitution

## Core Principles

### I. Layered Architecture, No Skipped Layers
Backend code MUST follow the existing layering: `routes → controllers → services →
repositories`. Controllers only orchestrate (parse request, call a service, shape the
response); business rules live in `services/`; all Supabase/Postgres access lives in
`repositories/`. Routes MUST NOT call repositories directly, and controllers MUST NOT
embed SQL/Supabase-client calls or cross-cutting business rules.
Rationale: this separation is already established across `backend/src/{controllers,
services,repositories}` and is what keeps the 99%+ test coverage meaningful — each layer
is testable (and mockable) independently.

### II. Validate at the Boundary
Every route that accepts client input MUST validate it with a Zod schema
(`backend/src/validators/`) through `validate.middleware.js` before it reaches a
controller. Controllers and services MUST be able to trust that inputs are well-formed;
defensive re-validation deeper in the stack is redundant and NOT required.
Rationale: matches the Phase 1 hardening decision ("la API ahora valida los datos antes
de guardarlos") — malformed input is rejected at the door, not chased through the stack.

### III. Tests Are the Merge Gate (NON-NEGOTIABLE)
No backend change is complete without accompanying tests in `backend/tests/{unit,
integration}`, and the full suite (`npm test` in `backend/`) MUST pass before a feature
is considered done. New endpoints or services require both a unit test (service/
controller logic in isolation) and an integration test (route-level, via Supertest) when
they touch the database or auth. Coverage MUST NOT regress below the level on `main` at
the time of the change.
Rationale: the project's baseline (257/257 tests, ~99.5% coverage) is a deliberate
quality bar set during Phase 1; SDD specs and plans exist to protect it, not bypass it.

### IV. Centralized Errors & Observability
All thrown errors MUST use the `AppError` hierarchy (`backend/src/errors/AppError.js`)
and flow through `errorHandler.middleware.js` — no ad-hoc `res.status(...).json(...)`
error responses inside controllers or services. Every request MUST be traceable via
`requestLogger.middleware.js` (request ID + Winston structured logs). New failure modes
MUST get a distinct `AppError` subtype/status rather than a generic 500.
Rationale: consistent error shapes and traceable request IDs are what make production
issues debuggable without attaching a live debugger.

### V. Security Is Not Optional
Every new endpoint MUST pass through `auth.middleware.js` when it touches non-public
data, and MUST be covered by `rateLimiter.middleware.js` where abuse is plausible
(auth, write, and messaging endpoints by default). Secrets NEVER get committed —
`.env.example` files hold placeholders only, real credentials stay in untracked `.env`.
Row Level Security policies in `supabase/migrations/` are the source of truth for
data-access rules and MUST be updated in the same change that changes what a role can
read/write.
Rationale: this codifies the fixed "clave secreta expuesta" incident and the Supabase
RLS model the project already relies on — security is reviewed per change, not bolted on
at the end.

### VI. Simplicity Over Speculative Abstraction (YAGNI)
Prefer the smallest change that satisfies the current spec. Do not add configuration
flags, generic plugin systems, or extra service layers for requirements the spec doesn't
state. Three similar lines beat a premature helper; a one-off script doesn't need a
framework.
Rationale: this is a bounded academic project (IS-489, UNSCH) built and maintained by a
small team — long-term speculative flexibility costs more in review time than it ever
saves.

## Technology Stack & Constraints

- **Backend**: Node.js + Express (ESM, `type: module`), Supabase (Postgres + Auth + RLS)
  as the persistence and identity layer, Zod for validation, Winston for logging, Jest +
  Supertest for tests, `express-rate-limit` + `helmet` for hardening.
- **Frontend**: React 19 + Vite, React Router 7, Tailwind CSS 4, Leaflet/`react-leaflet`
  for geolocation features, `motion` (Framer Motion) for animation.
- **Database changes** ship as timestamped SQL files under `supabase/migrations/`
  (`YYYYMMDDHHMMSS_description.sql`) — never as manual, undocumented schema edits.
- **Maki (AI assistant)** integrations (Gemini/Groq via `backend/src/services/maki/`)
  are additive features and MUST degrade gracefully (feature stays usable) if the AI
  provider call fails or is unavailable.
- New runtime dependencies (backend or frontend) MUST be justified in the spec/plan for
  the feature that introduces them — no speculative library additions.

## Development Workflow & Quality Gates

This project uses **Spec-Driven Development (SDD)** via GitHub's Spec Kit
(`.specify/`, skills under `.claude/skills/speckit-*`). The standard flow for any
non-trivial feature or fix is:

1. `/speckit-constitution` — only when project principles themselves change.
2. `/speckit-specify` — write the feature spec (the *what* and *why*, no implementation
   detail) into `specs/NNN-feature-name/spec.md`.
3. `/speckit-clarify` (recommended before planning if the spec has ambiguity) — resolve
   open questions before design work starts.
4. `/speckit-plan` — produce the implementation plan; this MUST pass the Constitution
   Check gate against this document before implementation begins.
5. `/speckit-tasks` — break the plan into ordered, dependency-aware tasks.
6. `/speckit-analyze` (recommended) — cross-check spec/plan/tasks consistency before
   writing code.
7. `/speckit-implement` — execute tasks, keeping `backend/tests` green throughout.

Feature branches follow the existing `feat/<short-description>` convention. Every PR
merging a spec'd feature MUST link the `specs/NNN-feature-name/` folder it implements.
Small fixes (typos, config tweaks, non-behavioral chores) do not require a full spec —
use judgment, but anything touching business logic, an endpoint contract, or the
database schema goes through the flow above.

## Governance

This constitution supersedes ad-hoc conventions when they conflict. All plans produced
by `/speckit-plan` MUST include a Constitution Check section verifying compliance with
the Core Principles above; unjustified deviations block moving to `/speckit-tasks`.
Justified deviations MUST be recorded in the plan's Complexity Tracking section with a
concrete rationale (a vague "for flexibility" is not sufficient).

Amendments to this constitution happen via a PR that edits this file directly:
- Bump **MAJOR** for backward-incompatible principle removal/redefinition.
- Bump **MINOR** for a new principle or materially expanded guidance.
- Bump **PATCH** for wording/clarification fixes with no semantic change.

Each amendment updates `Last Amended` below and appends a Sync Impact Report as an HTML
comment at the top of this file, listing any dependent templates that were checked or
updated as a result.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
