# GitHub Copilot Instructions — Monthly Family Budget

> **Documentação completa para desenvolvedores**: [`CONTRIBUTING.md`](../CONTRIBUTING.md)

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

## File Naming Conventions

### Components (`src/components/`)
| Type | Pattern | Example |
|------|---------|---------|
| UI primitives (shadcn) | `kebab-case.tsx` | `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx` |
| Domain components | `PascalCase.tsx` | `ExpenseForm.tsx`, `GoalCard.tsx` |
| Dialog/Modal wrappers | `{Name}Dialog.tsx` | `EntryFormDialog.tsx`, `GoalDetailsDialog.tsx` |
| Section components | `{Name}Section.tsx` | `ProfileSection.tsx`, `AuthSection.tsx` |
| Index exports | `index.tsx` or `index.ts` | Re-exports all domain components |

### Hooks (`src/hooks/`)
| Type | Pattern | Example |
|------|---------|---------|
| Domain hooks | `use{Domain}.ts` (camelCase) | `useBudget.ts`, `useGoals.ts` |
| UI hooks | `use-{name}.ts` (kebab-case) | `use-mobile.ts`, `use-toast.ts` |
| UI hooks folder | `src/hooks/ui/` | For reusable UI-related hooks |

### Services & Adapters (`src/lib/`)
| Type | Pattern | Example |
|------|---------|---------|
| Services | `{domain}Service.ts` | `budgetService.ts`, `familyService.ts` |
| Adapters | `{domain}Adapter.ts` | `expenseAdapter.ts`, `monthAdapter.ts` |
| Complex adapters | `src/lib/adapters/{domain}/` folder | `goal/goalCoreAdapter.ts` |
| Utilities | `src/lib/utils/{name}.ts` | `formatters.ts`, `monthUtils.ts` |
| Storage | `src/lib/storage/{name}.ts` | `secureStorage.ts`, `offlineStorage.ts` |
| Core lib files | `src/lib/{name}.ts` | `mappers.ts`, `validators.ts`, `logger.ts` |

### Other Files
| Type | Pattern | Example |
|------|---------|---------|
| Pages | `PascalCase.tsx` | `Budget.tsx`, `Goals.tsx` |
| Types | `camelCase.ts` | `budget.ts`, `database.ts` |
| Constants | `camelCase.ts` | `categories.ts` |
| Contexts | `{Name}Context.tsx` | `AuthContext.tsx`, `FamilyContext.tsx` |

### General Rules
- **Named exports only** — no default exports (except pages for lazy loading)
- **Index files** — use for barrel exports, not logic
- **Folder per domain** — when >3 related files, create subfolder
- **Suffix indicates purpose**: `*Service`, `*Adapter`, `*Context`, `*Dialog`, `*Section`

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
