Project: Monthly Family Budget - AI coding instructions

Summary
- This is a Vite + React + TypeScript single-page app using shadcn-ui components and Supabase as the backend.
- Key runtime behaviors: cloud vs offline families, Supabase realtime channels, and IndexedDB offline sync implemented in `src/hooks/useBudget.ts` and `src/lib/offlineStorage.ts`.

Architecture & Big Picture
- Frontend-only SPA: `src/main.tsx` mounts `src/App.tsx`, which composes providers (React Query, Theme, Language, Currency, Auth, Online, Family).
- `src/pages/Index.tsx` is the main UI surface that wires many components (`ExpenseChart`, `ExpenseList`, `RecurringExpenses`, `SubcategoryManager`) and shows how data flows from `useBudget()`.
- Data layer: `useBudget()` (hook) orchestrates data access. It reads/writes either to Supabase (cloud) or to an IndexedDB offline store (`src/lib/offlineStorage.ts`) depending on `isOfflineId(familyId)` and `navigator.onLine`.
- Realtime: Supabase realtime channels are created in `useBudget()` for `month`, `expense`, `recurring_expense`, `subcategory`, and `category_goal` tables.
- Auth: `src/contexts/AuthContext.tsx` uses Supabase client in `src/lib/supabase.ts` and handles session lifecycle and special hash-based post-auth flows.

Important Files/Directories (quick refs)
- App entry: src/main.tsx
- App composition: src/App.tsx
- Data orchestration: src/hooks/useBudget.ts
- Offline DB & sync: src/lib/offlineStorage.ts
- Supabase client: src/lib/supabase.ts
- Auth provider: src/contexts/AuthContext.tsx
- UI components: src/components/* and src/components/ui/* (shadcn-ui wrappers)
- Constants: src/constants/categories.ts
- Types: src/types/budget.ts

Developer Workflows
- Local dev: `npm i` then `npm run dev` (Vite on port 8080; base set to /monthly-family-budget/ in vite.config.ts).
- Build / preview: `npm run build` and `npm run preview`.
- Linting: `npm run lint` (ESLint configured).
- Notes:
  - The Vite dev server host is configured to `::` and port `8080` in `vite.config.ts`.
  - `lovable-tagger` runs only in development mode for component tagging.

Project-specific Conventions & Patterns
- Provider-first composition: `App.tsx` nests many context providers — when adding cross-cutting state, register it at top-level so components can consume it.
- Cloud vs Offline branching: Many hooks and lib functions use a `shouldUseOffline(familyId)` pattern. Follow existing pattern when adding CRUD operations: check offline path first, then cloud path, and queue failed cloud operations in `syncQueue`.
- Offline IDs vs UUIDs: `generateOfflineId()` is used for local records; cloud inserts should avoid sending custom `id` values (Supabase tables use UUIDs).
- Realtime channels: When mutating database tables, be aware `useBudget()` subscribes on tables and reloads on change — avoid redundant refreshes or race conditions when performing batch updates.
- i18n: Text is fetched via `useLanguage()` and `t('key')` — use translation keys from `src/i18n/translations/*`.
- UI primitives: `src/components/ui/*` are local wrappers around radix/ui + shadcn styles — use them for consistent styling.

Integration Points & External Dependencies
- Supabase: `src/lib/supabase.ts` holds the project URL and anon key. Many functions use `supabase.from(...).select/...` patterns.
- IndexedDB offline store: `src/lib/offlineStorage.ts` and `offlineDB` implement local persistence and a `syncQueue` for eventual upload.
- React Query: used for global cache/queries in `App.tsx` via `QueryClient` (but note: `useBudget()` uses manual fetching, not react-query hooks).
- Push notifications / toasts: `sonner` and custom `use-toast` hook are used for user feedback.

Examples to follow (copyable patterns)
- Checking offline vs cloud before write (from `useBudget.ts`):
  - if (shouldUseOffline(currentFamilyId)) { await offlineDB.put(...); await loadX(); return; }
  - else: perform `supabase.from('table').insert/update` and on error fallback to offline + `syncQueue.add(...)`
- Subscriptions setup (from `useBudget.ts`):
  - Create a channel: `supabase.channel('budget-${familyId}').on('postgres_changes', { ... }, handler).subscribe()`
  - Remove channel on cleanup with `supabase.removeChannel(channel)`
- Auth flow: `AuthContext` first subscribes `supabase.auth.onAuthStateChange`, then fetches `supabase.auth.getSession()`; when implementing auth-affecting features, follow the same sequence.

What to avoid / gotchas
- Never assume online-only: many codepaths must handle offline families (IDs flagged via `isOfflineId`). Missing offline handling will break use cases.
- Do not write to Supabase with custom `id` values for tables that expect UUIDs — use offline IDs only for local DB.
- Be careful mutating global state while realtime listeners also trigger reloads; prefer idempotent operations.
- Secrets: Supabase anon key is stored in `src/lib/supabase.ts`. Treat it as a public anon key (used client-side) but do not push server-side service keys here.

If you change data shapes
- Update `src/types/budget.ts` types and any mappings in `useBudget.ts` and `offlineStorage.ts`. Search for conversions like `category_key` -> `category` and `installment_current` -> `installmentInfo`.

When to run tests / run the app locally
- No test runner is present. Verify changes manually via `npm run dev` then exercise offline/cloud flows by switching network or using an offline family id pattern (see `offlineStorage` helpers).

Further notes / TODOs for maintainers
- Consider centralizing data fetching into React Query for cache consistency. Current code uses manual state management in `useBudget()`.

Questions? Tell me which area to expand (offline sync, Supabase schema mapping, or component conventions) and I'll iterate.
