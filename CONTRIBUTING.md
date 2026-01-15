# Guia do Desenvolvedor — Monthly Family Budget

> **⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO**

---

## 📋 Checklist Rápido

- [ ] `npm run build` e `npm run lint` passam
- [ ] Sem `console.*` (use `logger`)
- [ ] Sem credenciais hardcoded
- [ ] Arquivos nomeados corretamente (ver tabelas abaixo)

---

## 🏗️ Arquitetura

**Stack**: Vite + React + TypeScript + Supabase + IndexedDB

**Fluxo**: `Component → Hook → storageAdapter → Service (Supabase) | offlineAdapter (IndexedDB)`

| Camada | Path | Propósito |
|--------|------|-----------|
| Services | `src/lib/services/` | Wrappers Supabase |
| Adapters | `src/lib/adapters/` | Lógica online/offline |
| Hooks | `src/hooks/` | Orquestração de estado |
| Components | `src/components/{domain}/` | UI por domínio |

---

## 📁 Nomenclatura

### Componentes de Domínio

| Sufixo | Propósito | Exemplo |
|--------|-----------|---------|
| `*FormFields` | Campos de form (sem Dialog) | `ExpenseFormFields.tsx` |
| `*FormDialog` | Dialog criar/editar entidade | `ExpenseFormDialog.tsx` |
| `*ListDialog` | Dialog com lista + CRUD | `SubcategoryListDialog.tsx` |
| `*SettingsDialog` | Dialog com tabs/seções | `FamilySettingsDialog.tsx` |
| `*ViewDialog` | Dialog read-only | `GoalDetailsDialog.tsx` |
| `*SelectDialog` | Dialog seleção de item | `ImportExpenseDialog.tsx` |
| `*Card` | Exibição de entidade | `GoalCard.tsx` |
| `*List` | Lista renderizável | `ExpenseList.tsx` |
| `*Section` | Seção de página | `ProfileSection.tsx` |
| `*Chart` | Visualização de dados | `ExpenseChart.tsx` |
| `*Panel` | Painel autônomo complexo | `RecurringExpensesPanel.tsx` |
| `*Input` | Input customizado | `IncomeInput.tsx` |
| `*Selector` | Picker inline | `MonthSelector.tsx` |
| `*Button` | Botão com estado/lógica | `TriggerButton.tsx` |
| `*Progress` | Indicador de progresso | `GoalProgress.tsx` |

> **💡 Confirmações**: Use `ConfirmDialog` de `@/components/common`. NÃO crie dialogs de confirmação individuais.

### Primitivos UI (`src/components/ui/`)

**Exclusivo** para shadcn/radix: `kebab-case.tsx` (ex: `button.tsx`, `dialog.tsx`)

❌ NÃO colocar componentes customizados aqui

### Outros Arquivos

| Tipo | Padrão | Local |
|------|--------|-------|
| Domain hooks | `use{Domain}.ts` | `src/hooks/` |
| UI hooks | `use-{name}.ts` | `src/hooks/ui/` |
| Services | `{domain}Service.ts` | `src/lib/services/` |
| Adapters | `{domain}Adapter.ts` | `src/lib/adapters/` |
| Pages | `PascalCase.tsx` | `src/pages/` |
| Contexts | `{Name}Context.tsx` | `src/contexts/` |

### ❌ Proibido

| Não Use | Use |
|---------|-----|
| `*Manager`, `*Container`, `*Wrapper` | Sufixo específico da tabela |
| `*Form` (dialog), `*Modal` | `*FormDialog`, `*Dialog` |
| Multi-export de componentes | Um componente por arquivo |

---

## 🔒 Segurança

| ❌ Não | ✅ Sim |
|--------|--------|
| `console.log(x)` | `logger.debug('event', x)` |
| `const key = 'abc123'` | `import.meta.env.VITE_KEY` |
| `.insert(req.body)` | `.insert(validatedData)` via Zod |

> Detalhes: [`docs/security-instructions.md`](docs/security-instructions.md)

---

## 🎨 UI

- **Cores**: Tokens semânticos (`bg-background`, `text-muted-foreground`) — nunca hardcoded
- **Botões**: Cancelar = `outline`, Confirmar = `default`, Deletar = `destructive`
- **Ícones**: Lucide React, `h-4 w-4` (botões) ou `h-5 w-5` (títulos)

> Detalhes: [`docs/ui-standards.md`](docs/ui-standards.md)

---

## ⛔ O Que NÃO Fazer

- Chamar Supabase de componentes — use hooks
- Usar `navigator.onLine` sozinho — verifique `offlineAdapter.isOfflineId()` primeiro
- Colocar arquivos na raiz de `lib/` ou `components/` — use subpastas
- Inventar sufixos de componentes — use a taxonomia acima

---

## 🛠️ Comandos

```bash
npm run dev       # Dev server
npm run build     # Build produção
npm run lint      # ESLint
```

---

*Se algo parecer errado ou inseguro, provavelmente é. Pergunte antes de fazer.*