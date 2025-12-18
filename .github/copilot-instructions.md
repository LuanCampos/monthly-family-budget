Project: Monthly Family Budget (Vite + React + TypeScript)

Purpose: Give AI coding agents the precise, actionable context they need to be productive editing this repository.

Note: Also read .github/ARCHITECTURE.md — it contains environment setup and troubleshooting steps (Windows PATH fixes, Node version recommendation, and onboarding notes).

Quick facts
- Tech: Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui components.
- App entry: `src/main.tsx` -> `src/App.tsx`.
- Key folders: `src/components` (UI and feature components), `src/lib` (services/adapters), `src/contexts` (React context providers), `src/pages`.
- Dev commands: `npm i`, `npm run dev`, `npm run build`, `npm run preview` (see `package.json`).

Big-picture architecture
- Single-page React app built with Vite and TypeScript. Routing uses `react-router-dom` and views live under `src/pages`.
- UI is component-driven and integrates shadcn-style primitives under `src/components/ui/*` (Radix wrappers and custom styling). When adding UI, prefer using existing `ui/*` wrappers for consistent behavior.
- State & data flows:
  - Local UI state is inside components and hooks in `src/hooks`.
  - Application-level context providers are in `src/contexts` (e.g., `FamilyContext`, `CurrencyContext`, `ThemeContext`, `AuthContext`). Use these for cross-cutting app state.
  - Network and storage logic lives under `src/lib`:
    - `supabase.ts` initializes the Supabase client.
    - `budgetService.ts` exposes higher-level data operations.
    - `offlineAdapter.ts` and `offlineStorage.ts` handle offline-first logic — prefer using `budgetService` which coordinates online/offline handling.

Key integration points
- Supabase: the app uses `@supabase/supabase-js` in `src/lib/supabase.ts`. Changes that affect auth or DB schemas may require updating client code here.
- React Query: `@tanstack/react-query` is used for server-state caching and fetching; check `src/hooks/useBudgetApi.ts` and `useBudget.ts` patterns.
- Charts: `recharts` and custom chart components live in `src/components/*Chart.tsx` (e.g., `ExpenseChart.tsx`, `AnnualViewChart.tsx`). When passing data to charts, follow the existing data-format shapes used in those components.

Project-specific conventions
- Use the `ui/*` primitives for controls (inputs, dialogs, selects) to preserve styling and accessibility. Examples: `src/components/ui/input.tsx`, `ui/dialog.tsx`.
- Hooks naming: custom hooks live in `src/hooks` and follow `useXxx` naming (e.g., `useBudget`, `useBudgetApi`). Prefer returning stable references and memoized handlers.
- Context providers are JSX wrappers that supply app-level state. The provider files also typically expose small helper functions to consume the context.
- Types: shared domain types are in `src/types/budget.ts`. When adding fields, update these types first and propagate to related `useBudget*` hooks and `budgetService`.
- Forms: `react-hook-form` is used with zod for validation in many places — inspect `ExpenseFormFields.tsx` and `RecurringExpenseFormFields.tsx` for patterns.

Workflow notes & debugging
- Start dev server: `npm run dev`. Vite hot-module-replacement is enabled. Use the browser console and Vite terminal for errors.
- Build for production: `npm run build` or `npm run build:dev` for a development-mode build.
- Lint: `npm run lint` uses `eslint` configured at repo root. Follow existing lint rules.
- If changing auth, check `src/contexts/AuthContext.tsx` and `src/lib/supabase.ts` to ensure session handling remains consistent.

Files to inspect for common tasks (examples)
- Add a new page: mirror `src/pages/Index.tsx`, add route in routing root (see `src/App.tsx`).
- Add a new API call: extend `src/lib/budgetService.ts`, then add a typed hook in `src/hooks/useBudgetApi.ts` and a React Query key there.
- Update types: edit `src/types/budget.ts` and search for usages across `src/hooks` and `src/components`.
- Offline behavior: modify `src/lib/offlineAdapter.ts` and `src/lib/offlineStorage.ts`; test with the app in the browser offline mode.

Examples (copyable)
- Creating a new hook registration:
  - File: `src/hooks/useMyFeature.tsx`
  - Pattern: export a `useMyFeature()` hook that returns state and actions. Use React Query for server calls when applicable.
- Registering a context provider:
  - File: `src/contexts/MyContext.tsx`
  - Pattern: export a provider component and `useMyContext()` consumer helper.

Editing guidance for AI agents
- Preserve style and patterns: keep TypeScript types, follow `src/components/ui/*` wrappers for UI elements, reuse existing hooks and providers instead of creating global singletons.
- Keep changes minimal and focused; update types in `src/types/budget.ts` when you add domain fields.
- When editing network code, prefer adding functions to `budgetService.ts` and exposing hooks in `useBudgetApi.ts`.
- Run `npm run dev` and test critical flows for changes that touch auth, offline sync, or budgets.

If you modify this file
- Merge non-destructively: if `.github/copilot-instructions.md` already exists, update the relevant sections and preserve any added project-specific notes.

Questions
- If anything in these notes is unclear or you want more examples (routing, query keys, offline-sync), ask and I'll expand specific sections.
