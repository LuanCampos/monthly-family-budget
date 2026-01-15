# GitHub Copilot Instructions — Monthly Family Budget

## Stack & Architecture
**Vite + React + TypeScript + Supabase + IndexedDB** — Cloud-first, offline-capable family budget app.

**Data flow**: Component → Hook → `storageAdapter` → Service (Supabase) OR `offlineAdapter` (IndexedDB)

## Key Directories
| Layer | Path | Purpose |
|-------|------|---------|
| Services | `src/lib/services/` | Thin Supabase wrappers (budgetService, familyService, goalService, userService) |
| Adapters | `src/lib/adapters/` | Online/offline branching; `storageAdapter.ts` is the main entry point |
| Hooks | `src/hooks/` | State orchestration; `useBudget.ts`, `useGoals.ts`, `useBudgetState.ts` |
| Components | `src/components/{domain}/` | Domain folders: expense/, goal/, family/, recurring/, settings/, ui/ |
| Types | `src/types/` | `budget.ts` (app types), `database.ts` (DB rows with snake_case) |

## Critical Patterns

### Offline-safe code (adapters only)
```typescript
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  await offlineAdapter.put('table', data);  // IndexedDB
} else {
  const res = await budgetService.operation(data);  // Supabase
  if (res.error) {
    await offlineAdapter.put('table', data);
    await offlineAdapter.sync.add({ type: 'entity', action: 'insert', data, familyId });
  }
}
```

### Boolean fields — avoid nullish coalescing
```typescript
// ❌ WRONG: installment_current: recurring.hasInstallments ?? undefined
// ✅ RIGHT: installment_current: recurring.hasInstallments ? value : null
```

### Type mapping: DB (snake_case) → App (camelCase)
Use mappers in `src/lib/mappers.ts`; never transform inline.

## Commands
```bash
npm run dev       # Start dev server (localhost:8080)
npm run build     # Production build
npm run lint      # ESLint
```

## Conventions
- **Named exports only** — no default exports
- **Components**: Use `src/components/ui/*` (shadcn-ui/Radix); no direct Supabase calls
- **Adding data ops**: Service → Adapter (handle online/offline) → Export from storageAdapter → Call from hook
- **Strict TS**: No `any`, explicit types, handle null/undefined

## Don't
- Call Supabase from components — use hooks
- Use `navigator.onLine` alone — check `offlineAdapter.isOfflineId(familyId)` first
- Place files in root `lib/` or `components/` — use subfolders
