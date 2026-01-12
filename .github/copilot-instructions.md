# GitHub Copilot / AI Agent Instructions for Monthly Family Budget

## Purpose
Give AI coding agents the immediately actionable, project-specific knowledge they need to be productive in this repository.

## Quick Orientation

**Stack**: Vite + React + TypeScript + Supabase + IndexedDB (offline)

**Key Files & Layers**:
- **UI**: `src/components/` organized by domain (expense, recurring, family, settings, income, month, subcategory, goal, common) + `ui/` for primitives
- **State**: `src/hooks/useBudget.ts`, `useBudgetApi.ts`, `useBudgetState.ts`, `useGoals.ts`; `src/hooks/ui/` for UI-only hooks
- **Data Layer**: 
  - `src/lib/services/` - Supabase API calls (budgetService, userService, familyService, goalService)
  - `src/lib/adapters/` - Online/offline branching logic (monthAdapter, expenseAdapter, recurringAdapter, subcategoryAdapter, goalAdapter, storageAdapter, offlineAdapter)
  - `src/lib/utils/` - monthUtils, appBaseUrl, common helpers
  - `src/lib/storage/` - offlineStorage for IndexedDB
  - `src/lib/mappers.ts`, `schemas.ts`, `validators.ts`, `logger.ts`
- **Context**: `src/contexts/` provides state (FamilyContext, AuthContext, LanguageContext, CurrencyContext, ThemeContext, OnlineContext)
- **Types**: `src/types/` centralized (budget.ts, database.ts, index.ts barrel)

## Architecture Pattern

**Cloud-first, offline-capable**:
1. Services (`src/lib/services/*`) - thin Supabase wrappers, single-purpose functions
2. Adapters (`src/lib/adapters/*`) - centralize online/offline branching
   - `storageAdapter.ts` is the main coordinator used by hooks and contexts
   - `offlineAdapter.ts` handles IndexedDB and sync queue
   - Domain adapters (month, expense, recurring, subcategory) encapsulate business logic
3. Hooks - orchestration layer, call adapters and update state
4. Contexts - provide global state (family, auth, language, currency, theme, online status)
5. Components - presentational, no direct DB access

**Key flows**:
- Data operations: Component → Hook → `storageAdapter` → (online: Service/Supabase OR offline: `offlineAdapter`/IndexedDB)
- State: Contexts provide IDs/flags, Hooks manage local state, Components render
- Realtime: `storageAdapter.createChannel()` creates Supabase channels

## Important Patterns & Conventions

### Services
- One file per domain (budgetService, userService, familyService)
- Direct Supabase calls only - no branching logic
- Small, deterministic functions
- Example: `budgetService.getMonths(familyId)` maps 1:1 to `SELECT * FROM months WHERE family_id = $1`

### Adapters
- `storageAdapter.ts` - main entry point for data operations, normalizes online/offline
- Domain adapters (month, expense, recurring, subcategory, goal) - business logic, can call services and offlineAdapter
- `offlineAdapter.ts` - canonical IndexedDB interface
  - `generateOfflineId()` - create offline IDs
  - `isOfflineId(familyId)` - check if in offline mode
  - `sync.add()` - enqueue operations for later sync
- When operation fails online, fallback to offline + enqueue sync

### Offline Logic
- `offlineAdapter.isOfflineId(familyId)` determines online/offline mode for that family
- Don't use `navigator.onLine` alone - it's unreliable
- Both code paths (online/offline) must be maintained in adapters
- Fields like `installment_current`, `installment_total` must be conditionally assigned based on `hasInstallments` boolean

### Hooks
- Business logic hooks in root: `useBudget.ts`, `useBudgetApi.ts`, `useBudgetState.ts`, `useGoals.ts`, `useUserPreferences.ts`, `useGeneralSettings.ts`, `useProfileSettings.ts`, `useAuthSettings.ts`
- UI-only hooks in `ui/` folder: `use-mobile.tsx`, `use-toast.ts` (kebab-case)
- Hooks call `storageAdapter` or services for operations
- State patterns use `useBudgetState.ts` setters: `setMonths()`, `setExpenses()`, etc.
- Goals have their own self-contained state in `useGoals.ts` (not part of useBudgetState)

### Componentsgoal/`, `common/`, `ui/`
- Each folder has index.tsx for re-exports
- Use primitives from `src/components/ui/*` (shadcn-ui)
- No direct imports of `src/lib/*` - use hooks
- Named exports (no default export)
- Goal components: GoalCard, GoalForm, GoalList, GoalProgress, GoalTimelineChart, GoalMonthlySuggestion, GoalDetailsDialog, EntryForm, EntryHistory, ImportExpenseDialog- use hooks
- Named exports (no default export)

### Validation
- Input validation: `src/lib/validators.ts` (Zod input schemas)
- Database row validation: `src/lib/schemas.ts` (Zod database schemas)
- Mappers: `src/lib/mappers.ts` transform DB rows (snake_case) → App types (camelCase)

### Logging
- `src/lib/logger.ts` - structured logging with 4 levels: debug, info, warn, error
- Usage: `logger.info('entity.action.status', { context })`
- Integrated throughout adapters for debugging

## Developer Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run build:dev    # Dev-mode build (no minification)
npm run lint         # Run eslint
npm run preview      # Preview production build
```

## Files You'll Frequently Edit
, `goalAdapter.ts`
- `src/lib/adapters/storageAdapter.ts` (wrapper/coordinator)
- `src/lib/services/budgetService.ts`, `userService.ts`, `familyService.ts`, `goalService.ts`

**State management**:
- `src/hooks/useBudget.ts`, `useBudgetApi.ts`, `useBudgetState.ts`, `useGoals.ts`

**UI Components**:
- `src/components/{expense,recurring,family,settings,month,income,subcategory,goal
**UI Components**:
- `src/components/{expense,recurring,family,settings,month,income,subcategory,common}/`

**Types**:
- `src/types/budget.ts` (app types), `database.ts` (DB rows), `index.ts` (barrel)

## Common Tasks & Patterns

### Adding a data operation
1. Add to service (e.g., `budgetService.newOperation()`)
2. Create adapter wrapper (e.g., `monthAdapter.operationName()`) handling online/offline
3. Export from `storageAdapter` or adapter's `index.ts`
4. Call from hook using `storageAdapter.operationName()`

### Creating offline-safe code
```typescript
// In an adapter:
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  // offline path: use IndexedDB
  await offlineAdapter.put('table', data);
} else {
  // online path: use Supabase
  const res = await budgetService.operation(data);
  if (res.error) {
    // Fallback to offline
    await offlineAdapter.put('table', data);
    await offlineAdapter.sync.add({ type: 'entity', action: 'insert', data, familyId });
  }
}
```

### Conditional field assignment (important!)
```typescript
// WRONG: doesn't handle false values
const expense = {
  installment_current: recurring.hasInstallments ?? undefined  // ❌ false becomes undefined
};

// RIGHT: preserve false/true
const expense = {
  installment_current: recurring.hasInstallments ? result.installmentNumber : null
};
```

### Adding a component
1. Create folder: `src/components/{domain}/MyComponent.tsx`
2. Add to `src/components/{domain}/index.tsx`: `export { MyComponent } from './MyComponent'`
3. Import in other files: `import { MyComponent } from '@/com

### Goals Feature Pattern
Goals track savings/financial targets with entries. Key patterns:
- Goals can link to subcategories/categories to auto-track expenses
- Goal entries can be manual (user-added) or imported (from expenses)
- `useGoals` hook manages state separately from `useBudget` (self-contained)
- Components in `src/components/goal/` follow same structure as other domains
- Historical expense import allows linking past expenses to new goals
- Monthly suggestions calculate recommended contributions based on target dateponents/{domain}'`
4. Use named export: `export const MyComponent = (...) => {}`

## Windows PATH Troubleshooting (Node.js/npm not found)

**Symptom**: `node : The term 'node' is not recognized` in PowerShell terminal

**Fix**:
1. Verify Node.js is installed: `C:\Program Files\nodejs` should exist
2. In PowerShell, check User PATH: `[Environment]::GetEnvironmentVariable('Path','User')`
3. Ensure `C:\Program Files\nodejs` is in User PATH (or Machine PATH)
4. If missing, add it: `[Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Program Files\nodejs', 'User')`
5. Restart VS Code / terminal completely
6. Test: `node --version`

**Note**: Environment changes take effect only in NEW terminal sessions.goal/, etc.)
- Lib: Organized by layer (services/, adapters/, utils/, storage/)
- Hooks: Separated UI hooks (ui/) from business logic hooks
- All imports updated, build validated

### New Features ✅
- **Goals Feature**: Track savings targets with manual/imported entries, linked subcategories, timeline charts, monthly suggestions
  - New domain: `goalAdapter.ts`, `goalService.ts`, `useGoals.ts`, `src/components/goal/`
  - Dedicated page: `src/pages/Goals.tsx`
  - Types: `Goal`, `GoalEntry` in `src/types/budget.ts` and `database.ts`
### Phase 1-3 Completed ✅
- **Phase 1**: Type safety foundation (database.ts, monthUtils.ts, logger.ts)
- **Phase 2**: Modularization (adapters/, services/, schemas, validators, mappers)
- **Phase 3**: Patterns + simplification (standardized nomenclature, custom hooks, logging)

### Recent Reorganization ✅
- Components: Organized into subfolders by domain (expense/, recurring/, family/, etc.)
- Lib: Organized by layer (services/, adapters/, utils/, storage/)
- Hooks: Separated UI hooks (ui/) from business logic hooks
- All imports updated, build validated

### Bug Fixes ✅
- Installment fields now conditionally assigned (checks `hasInstallments`)
- Month limits validated to sum to 100%
- Mapper fixed for `hasInstallments` (removed nullish coalescing issue)
- Offline data properly mapped before calling business logic

## What NOT to Do

- ❌ Don't call Supabase directly from components - use hooks
- ❌ Don't assume `navigator.onLine` - check `offlineAdapter.isOfflineId(familyId)` first
- ❌ Don't use `??` for boolean fields - use proper null/false checks
- ❌ Don't mix online/offline logic in components - keep in adapters
- ❌ Don't use default exports - use named exports
- ❌ Don't put files in root of `lib/` or `components/` - organize into subfolders

## TypeScript Strict Mode ✅

Project enforces `January 12, 2026`tsconfig.json`. This means:
- All types must be explicit
- `any` is forbidden
- `null` and `undefined` must be handled
- No implicit `any` parameters

## Build & Validation

- **TypeScript**: 0 errors (verified with `npx tsc --noEmit`)
- **ESLint**: Runs on all files (`npm run lint`)
- **Build**: Vite 5.4.21, 2634 modules, ~1.2MB gzipped
- **CI**: Not yet integrated (future work)

---

**Last Updated**: December 23, 2025 | **Status**: Production-ready ✅
