Project Architecture and Refactor Guide
=====================================

Purpose
-------
Provide a concise set of goals, conventions and an incremental rollout plan to clean and improve the project's architecture so maintenance and contribution become easier.

Goals
-----
- Improve modularity: separate domain logic, data access, and UI.
- Make services testable by introducing small, pure functions and thin adapters.
- Centralize types and invariants in `src/types`.
- Standardize hooks and contexts APIs for predictability and DX.
- Preserve offline-first behavior while clarifying sync boundaries.
- Add automated checks (lint, tests, build) to CI.

High-level guidelines
---------------------
- Domain types: prefer `src/types/*` for shared interfaces and keep them minimal and pure.
- Service layer: `src/lib/*` should expose deterministic, side-effect-light functions. Move Supabase-specific details into `lib/supabase.ts` and adaptors (e.g., `offlineAdapter`).
- Hooks: `useXxx` should be thin orchestration surfaces that call services and update local state. Keep long functions split into helpers.
- Contexts: provide typed providers with small public APIs and keep heavy data operations in services.
- UI: prefer existing `src/components/ui/*` primitives; components in `src/components` should be presentational and composable.
- Offline vs online: centralize the decision and sync logic in a single adapter so callers use a `storageApi` rather than branching everywhere.

Incremental rollout plan
------------------------
1) Baseline: run `npm run lint` and capture failures. Add `npm test` integration later.
2) Centralize types: audit `src/types` and migrate any inline interfaces into these files.
3) Service consolidation: expand `src/lib/budgetService.ts` to encapsulate all Supabase calls and create an explicit `storageAdapter` interface for offline/local implementations.
4) Hooks split: refactor `useBudget` to rely on `createBudgetApi` only (remove duplicated logic) and move heavy helpers into `src/lib`.
5) Context cleanup: slim contexts to only hold state and minimal actions; delegate network/offline to services.
6) Tests: add unit tests for `lib/*` operations and key hooks using mocked adapters.
7) CI: add lint/test/build pipelines with gated PRs.

Safety & migration
------------------
- Make small PRs per step and keep behavior-preserving commits.
- Add feature flags or config toggles for switching between old/new implementations while migrating.

Files to update first (suggested)
-------------------------------
- `src/types/budget.ts`
- `src/lib/budgetService.ts`
- `src/lib/offlineAdapter.ts`
- `src/hooks/useBudgetApi.ts`
- `src/hooks/useBudget.ts`
- `src/contexts/*Context.tsx`

How to use this doc
--------------------
Follow the incremental rollout plan. Each refactor should include tests or manual verification steps. Keep PRs small and reviewable.

Current status (automatic snapshot)
----------------------------------
- `src/types/index.ts` added and many imports updated to use the central types barrel. `Centralize domain types` completed.
- `src/lib/storageAdapter.ts` added to centralize online/offline logic and act as a single storage API.
- `src/hooks/useBudgetApi.ts` refactored to use `storageAdapter` instead of duplicating offline/online branching.
- `src/hooks/useBudget.ts` refactor in-progress: now uses `storageAdapter` for data loading and many operations, and `createBudgetApi` is still used for orchestration.
- `src/lib/budgetService.ts` updated with `deleteMonthById` (small helper) to keep Supabase-specific operations encapsulated.

What remains (next steps)
-------------------------
1) Finish `useBudget` refactor:
	- Remove remaining direct Supabase calls in `useBudget` (if any) and delegate to `storageAdapter` or `budgetService`.
	- Ensure realtime channel creation/removal is consistently routed via the adapter.
2) Refactor context providers:
	- Start with `src/contexts/FamilyContext.tsx`: move heavy network/offline logic into `storageAdapter` or small service helpers and keep provider focused on state and actions.
	- Repeat for `AuthContext`, `CurrencyContext` as needed.
3) Harden `storageAdapter` tests:
	- Add unit tests that mock `offlineAdapter` and `budgetService` to validate behavior in offline/online modes.
4) Add CI jobs:
	- Add `lint` and `test` steps into GitHub Actions (or existing CI) and gate PRs.
5) Incremental PR plan:
	- Small PR #1: types barrel + import updates (already applied).
	- Small PR #2: `storageAdapter` + `useBudgetApi` changes (already applied).
	- Small PR #3: finish `useBudget` refactor + tests.
	- Small PR #4: context providers cleanup + tests.

Notes & verification
--------------------
- Local tooling: node is installed on the machine, but the env terminal needs to be configured by some commands to use it, because is a powershell terminal and don't have a lot of access yet.

Checkpoint: when continuing next time, open this file and pick the next uncompleted step under "What remains". Prefer small, behavior-preserving PRs and include unit tests for `storageAdapter` before changing contexts that depend on it.
