# GitHub Copilot / AI Agent Instructions for Monthly Family Budget

Purpose
-------
Give AI coding agents the immediately actionable, project-specific knowledge
they need to be productive in this repository.

Quick orientation
-----------------
- This is a Vite + React + TypeScript single-page app. Key runtime files:
  - src/main.tsx, src/App.tsx — app entry and routing
  - src/components — presentational UI components (use primitives in src/components/ui)
  - src/lib — service layer: `budgetService.ts`, `storageAdapter.ts`, `offlineAdapter.ts`, `supabase.ts`
  - src/lib — service layer: `budgetService.ts`, `userService.ts`, `familyService.ts`, `storageAdapter.ts`, `offlineAdapter.ts`, `supabase.ts`
  - src/hooks — app hooks (notably `useBudget.ts`, `useBudgetApi.ts`, `useBudgetState.ts`)
  - src/contexts — providers (FamilyContext controls `currentFamilyId` used by hooks)

Big-picture architecture
------------------------
- Cloud-first, offline-capable architecture:
  - `src/lib/budgetService.ts` is the thin Supabase wrapper (network layer).
  - `src/lib/offlineAdapter.ts` and `src/lib/offlineStorage.ts` provide IndexedDB persistence and a sync queue.
  - `src/lib/storageAdapter.ts` centralizes online/offline branching and higher-level operations used by hooks and contexts.
  - Hooks (e.g., `useBudget`) call the `storageAdapter` or `createBudgetApi` for operations; contexts provide identifying state (family, auth).
- Realtime: Supabase channels are created via `budgetService.createChannel` and routed through `storageAdapter.createChannel`.

Important patterns & conventions
------------------------------
- Prefer `storageAdapter` for data operations. It normalizes branching for cloud vs offline families and enqueues sync items when network operations fail.
- `budgetService` functions should map 1:1 to Supabase table operations (single-purpose, small wrappers).
- `userService` and `familyService` provide user and family management operations (invitations, membership, role handling) and are the canonical places to look for auth/family-related Supabase calls. Prefer using these small services rather than calling `supabase` directly from UI code.
- `offlineAdapter` is the canonical local-storage interface; use `offlineAdapter.generateOfflineId()` and `offlineAdapter.isOfflineId()` for offline objects.
- State initialization and refresh flows live in `useBudget` and `createBudgetApi`; effects call `api.load*()` methods and rely on `setMonths` etc. from `useBudgetState`.
- UI components should use primitives in `src/components/ui/*` for visual consistency.

Developer workflows (commands)
----------------------------
- Install dependencies: `npm install`
- Dev server: `npm run dev` (Vite)
- Build: `npm run build` or `npm run build:dev` (dev-mode build)
- Lint: `npm run lint` (runs `eslint .`)
- Preview production build: `npm run preview`

Files & locations you will frequently open
-----------------------------------------
- Data & adapters: src/lib/storageAdapter.ts, src/lib/budgetService.ts, src/lib/offlineAdapter.ts, src/lib/offlineStorage.ts
- Hooks: src/hooks/useBudget.ts, src/hooks/useBudgetApi.ts, src/hooks/useBudgetState.ts
- Contexts: src/contexts/FamilyContext.tsx, AuthContext.tsx
- UI primitives: src/components/ui/* (copy existing patterns for classes and props)
- Types: src/types/* (centralized type barrel in src/types/index.ts)

Repository-specific tips for AI edits
-----------------------------------
- Small, behavior-preserving PRs: prefer minimal changes that keep the existing public surface identical (the repo emphasizes incremental refactors).
- When modifying data flows, update `storageAdapter` first and switch callers to it; `useBudget` and contexts should delegate to `storageAdapter` rather than calling `supabase` directly.
- Use `offlineAdapter.sync.add(...)` to enqueue sync operations for later background sync if an online call fails.
- Realtime subscriptions: call `storageAdapter.createChannel()` and `storageAdapter.removeChannel()`; do not directly manipulate `supabase` channels in UI code.
- Tests and CI are not yet present; prefer not to add large test suites in a single PR — split into incremental PRs that add small unit tests for `lib/*` helpers.
- Read `.github/FIX_NPM.md` for troubleshooting Windows PATH issues with Node.js and npm.

Examples (patterns extracted from the codebase)
--------------------------------------------
- Insert a month that works offline-first (pattern):

  const res = await storageAdapter.insertMonth(currentFamilyId, year, month);
  // res may be an offline object (has id) or a Supabase response ({ data, error })

- Generate an offline id for a new expense:

  const offlineExpense = { id: offlineAdapter.generateOfflineId('exp'), ... };
  await offlineAdapter.put('expenses', offlineExpense);

- Enqueue sync after failed cloud write:

  if (res.error) await offlineAdapter.sync.add({ type: 'expense', action: 'insert', data: offlineExpense, familyId });

What not to assume
------------------
- Do not assume `navigator.onLine` is always reliable — check `offlineAdapter.isOfflineId(familyId)` first for offline families.
- Do not assume Supabase operations always return `data` — callers in `storageAdapter` check for `error` and fallback to offline storage.

When merging with existing docs
-------------------------------
- Preserve the small migration guidance already present in .github/FIX_NPM.md; it contains useful step-by-step refactor notes and Windows PATH troubleshooting.

Next steps for maintainers (suggested)
-------------------------------------
- Add a small CI pipeline step to run `npm run lint` (already in package.json) and eventually `npm test`.
- Add a short ARCHITECTURE.md pointing to `src/lib/storageAdapter.ts` as the canonical place to change sync logic.

If anything here is unclear, tell me which area (adapters, hooks, contexts, build) to expand with file-level examples.
