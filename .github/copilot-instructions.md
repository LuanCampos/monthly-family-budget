# GitHub Copilot Instructions — Monthly Family Budget

> **🚨 REGRA PRINCIPAL**: Sempre siga [`CONTRIBUTING.md`](../CONTRIBUTING.md) como fonte de verdade.
> Este arquivo é um resumo. Em caso de dúvida, consulte CONTRIBUTING.md.

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

## Component Naming — MANDATORY Taxonomy

> **⚠️ CRITICAL**: Each suffix has specific meaning. Use the correct one.

| Suffix | Purpose | Example |
|--------|---------|---------|
| `*FormFields` | Form fields ONLY — no Dialog, no submit | `ExpenseFormFields.tsx` |
| `*FormDialog` | Dialog to create/edit ONE entity | `ExpenseFormDialog.tsx`, `GoalFormDialog.tsx` |
| `*ListDialog` | Dialog with list + inline CRUD | `SubcategoryListDialog.tsx` |
| `*SettingsDialog` | Complex dialog with tabs/sections | `FamilySettingsDialog.tsx` |
| `*ViewDialog` | Read-only detail view | `GoalViewDialog.tsx` |
| `*SelectDialog` | Item picker dialog | `ExpenseSelectDialog.tsx` |
| `*Card` | Single entity display | `GoalCard.tsx` |
| `*List` | Renderable list (NOT a Dialog) | `ExpenseList.tsx` |
| `*Section` | Page section | `ProfileSection.tsx` |
| `*Chart` | Data visualization | `ExpenseChart.tsx` |
| `*Panel` | Complex autonomous component | `LimitsPanel.tsx`, `RecurringExpensesPanel.tsx` |
| `*Input` | Custom input field | `IncomeInput.tsx` |
| `*Selector` | Inline picker (no dialog) | `MonthSelector.tsx`, `YearSelector.tsx` |
| `*Button` | Stateful custom button | `TriggerButton.tsx` |
| `*Progress` | Progress indicator | `GoalProgress.tsx` |

> **💡 Confirmations**: Use `ConfirmDialog` from `@/components/common` — generic reusable component. **DO NOT create** individual `Delete*ConfirmDialog` files.

### ❌ FORBIDDEN Suffixes
| Don't Use | Use Instead |
|-----------|-------------|
| `*Manager` | `*ListDialog` or `*SettingsDialog` |
| `*Form` (for dialogs) | `*FormDialog` |
| `*Modal` | `*Dialog` |
| `*Component` | Specific suffix |
| `*Container` | `*Section`, `*Panel`, or `*List` |
| `*Wrapper` | Describe actual function |
| Plural without suffix | `*List`, `*Panel`, or `*Section` |
| `*ConfirmDialog` (individual) | Use generic `ConfirmDialog` from `/common` |

### ❌ Multi-export FORBIDDEN
- **One component per file** — never export multiple components from same file
- **Exception**: Index files (re-exports only), types files, internal helper components

## Other File Naming

| Type | Pattern | Location | Example |
|------|---------|----------|---------|
| UI primitives (shadcn) | `kebab-case.tsx` | `src/components/ui/` | `button.tsx`, `dialog.tsx` |
| Domain hooks | `use{Domain}.ts` | `src/hooks/` | `useBudget.ts`, `useGoals.ts` |
| UI hooks | `use-{name}.ts` | `src/hooks/ui/` | `use-mobile.ts`, `use-toast.ts` |
| Services | `{domain}Service.ts` | `src/lib/services/` | `budgetService.ts` |
| Adapters | `{domain}Adapter.ts` | `src/lib/adapters/` | `expenseAdapter.ts` |
| Complex adapters | `{function}Adapter.ts` | `src/lib/adapters/{domain}/` | `goalCoreAdapter.ts` |
| Utilities | `{name}.ts` | `src/lib/utils/` | `formatters.ts` |
| Storage | `{name}Storage.ts` | `src/lib/storage/` | `secureStorage.ts` |
| Core lib | `{name}.ts` | `src/lib/` | `mappers.ts`, `logger.ts` |
| Pages | `PascalCase.tsx` | `src/pages/` | `Budget.tsx`, `Goals.tsx` |
| Contexts | `{Name}Context.tsx` | `src/contexts/` | `AuthContext.tsx` |

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
- Use forbidden suffixes (`*Manager`, `*Form` for dialogs, `*Modal`)
- Invent new suffixes — use the taxonomy from CONTRIBUTING.md
