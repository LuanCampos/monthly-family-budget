# Guia do Desenvolvedor — Monthly Family Budget

> **⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO**

---

## 📋 Checklist de Pull Request

Antes de abrir um PR, verifique:

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa com **zero warnings**
- [ ] Sem `console.*` — use `logger` de `@/lib/logger`
- [ ] Sem credenciais hardcoded — use `import.meta.env.*`
- [ ] Arquivos nomeados conforme taxonomia (ver seções abaixo)
- [ ] Um componente por arquivo (exceto re-exports em `index.ts`)
- [ ] Tipos explícitos — sem `any` (use `unknown` quando necessário)

---

## 🏗️ Arquitetura

**Stack**: Vite + React 18 + TypeScript (strict) + Supabase + IndexedDB

### Fluxo de Dados

```
Component → Hook → storageAdapter → Service (Supabase)
                                  ↘ offlineAdapter (IndexedDB)
```

### Camadas

| Camada | Path | Responsabilidade |
|--------|------|------------------|
| **Pages** | `src/pages/` | Composição de layout, roteamento |
| **Components** | `src/components/{domain}/` | UI por domínio de negócio |
| **Hooks** | `src/hooks/` | Orquestração de estado e side effects |
| **Adapters** | `src/lib/adapters/` | Abstração online/offline |
| **Services** | `src/lib/services/` | Wrappers Supabase (thin layer) |
| **Contexts** | `src/contexts/` | Estado global (auth, theme, family) |

### Princípios

- **Separation of Concerns**: Componentes não acessam Supabase diretamente
- **Offline-First**: Toda operação de dados passa por `storageAdapter`
- **Single Source of Truth**: Estado vive em hooks, não em componentes

---

## 📁 Nomenclatura

### Componentes de Domínio (`src/components/{domain}/`)

| Sufixo | Responsabilidade | Exemplo |
|--------|------------------|---------|
| `*FormFields` | Campos de formulário (sem Dialog, sem submit) | `ExpenseFormFields.tsx` |
| `*FormDialog` | Dialog para criar/editar UMA entidade | `ExpenseFormDialog.tsx` |
| `*ListDialog` | Dialog com lista + CRUD inline | `SubcategoryListDialog.tsx` |
| `*SettingsDialog` | Dialog complexo com tabs/seções | `FamilySettingsDialog.tsx` |
| `*ViewDialog` | Dialog read-only para detalhes | `GoalDetailsDialog.tsx` |
| `*SelectDialog` | Dialog para seleção de item | `ImportExpenseDialog.tsx` |
| `*Card` | Exibição compacta de uma entidade | `GoalCard.tsx` |
| `*List` | Lista renderizável (não é Dialog) | `ExpenseList.tsx` |
| `*Section` | Seção de página | `ProfileSection.tsx` |
| `*Chart` | Visualização de dados | `ExpenseChart.tsx` |
| `*Panel` | Componente autônomo complexo | `RecurringExpensesPanel.tsx` |
| `*Input` | Input customizado | `IncomeInput.tsx` |
| `*Selector` | Picker inline (sem dialog) | `MonthSelector.tsx` |
| `*Button` | Botão com estado/lógica própria | `TriggerButton.tsx` |
| `*Progress` | Indicador de progresso | `GoalProgress.tsx` |

> **💡 Confirmações**: Use `ConfirmDialog` de `@/components/common` — **NUNCA** crie dialogs de confirmação individuais como `Delete*ConfirmDialog`.

### Primitivos UI (`src/components/ui/`)

- **Exclusivo** para componentes shadcn/radix
- Nomenclatura: `kebab-case.tsx` (ex: `button.tsx`, `dialog.tsx`)
- ❌ **NÃO** colocar componentes customizados aqui

### Outros Arquivos

| Tipo | Padrão | Local | Exemplo |
|------|--------|-------|---------|
| Domain hooks | `use{Domain}.ts` | `src/hooks/` | `useBudget.ts` |
| UI hooks | `use-{name}.ts` | `src/hooks/ui/` | `use-mobile.ts` |
| Services | `{domain}Service.ts` | `src/lib/services/` | `budgetService.ts` |
| Adapters | `{domain}Adapter.ts` | `src/lib/adapters/` | `expenseAdapter.ts` |
| Pages | `PascalCase.tsx` | `src/pages/` | `Budget.tsx` |
| Contexts | `{Name}Context.tsx` | `src/contexts/` | `AuthContext.tsx` |
| Types | `{name}.ts` | `src/types/` | `budget.ts` |
| Utils | `{name}.ts` | `src/lib/utils/` | `formatters.ts` |

### ❌ Sufixos Proibidos

| Não Use | Use Em Vez |
|---------|------------|
| `*Manager` | `*ListDialog`, `*Panel`, ou `*Section` |
| `*Container` | `*Section` ou `*Panel` |
| `*Wrapper` | Descreva a função real |
| `*Form` (para dialogs) | `*FormDialog` |
| `*Modal` | `*Dialog` |
| `*Component` | Sufixo específico da taxonomia |
| Plural sem sufixo | `*List`, `*Panel`, ou `*Section` |

---

## 🔐 Segurança

| ❌ Proibido | ✅ Correto |
|-------------|------------|
| `console.log(data)` | `logger.debug('context', data)` |
| `const apiKey = 'abc123'` | `import.meta.env.VITE_API_KEY` |
| `.insert(req.body)` | `.insert(schema.parse(data))` via Zod |
| `eval()`, `new Function()` | Nunca usar |
| `dangerouslySetInnerHTML` | Evitar; se necessário, sanitizar |

> Detalhes completos: [`docs/security-instructions.md`](docs/security-instructions.md)

---

## 🎨 Padrões de UI

### Cores

Sempre use tokens semânticos do tema:

```tsx
// ✅ Correto
className="bg-background text-foreground border-border"
className="text-muted-foreground bg-muted"

// ❌ Errado
className="bg-white text-gray-900"
style={{ color: '#333' }}
```

### Botões

| Ação | Variant | Exemplo |
|------|---------|---------|
| Cancelar | `outline` | `<Button variant="outline">` |
| Confirmar/Salvar | `default` | `<Button>Salvar</Button>` |
| Deletar/Destrutiva | `destructive` | `<Button variant="destructive">` |

### Ícones

- **Biblioteca**: Lucide React exclusivamente
- **Tamanhos**: `h-4 w-4` (botões/inline) ou `h-5 w-5` (títulos/destaque)

### Dialogs de Confirmação

Use sempre `ConfirmDialog` de `@/components/common`:

```tsx
<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Excluir gasto?"           // Direto, sem "Tem certeza..."
  description="Esta ação não pode ser desfeita."
  confirmText="Excluir"
  variant="destructive"            // "destructive" | "warning" | "default"
  onConfirm={handleDelete}
/>
```

> Detalhes completos: [`docs/ui-standards.md`](docs/ui-standards.md)

---

## 🧹 ESLint e TypeScript

### Zero Warnings Policy

O projeto mantém **zero warnings** de lint. Não introduza novos warnings.

### react-hooks/exhaustive-deps

Sempre inclua todas as dependências. Setters de `useState` são estáveis:

```tsx
// ✅ Correto
const loadData = useCallback(async () => {
  const data = await fetchData(familyId);
  setData(data);
}, [familyId, setData]);

// ❌ Errado - dependência faltando
const loadData = useCallback(async () => {
  const data = await fetchData(familyId);
  setData(data);
}, [familyId]); // setData missing
```

**Quando usar eslint-disable**: Apenas quando omissão é INTENCIONAL para evitar loops:

```tsx
useEffect(() => {
  if (isOnline) syncNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // syncNow omitido intencionalmente para evitar loop infinito
}, [isOnline]);
```

### no-explicit-any

Nunca use `any`. Prefira tipos específicos ou `unknown`:

```tsx
// ❌ Proibido
const handleError = (error: any) => { ... }

// ✅ Correto
const handleError = (error: unknown) => { ... }
const handleError = (error: Error | PostgrestError) => { ... }
```

---

## 📴 Padrões Offline-First

### Verificação de Conectividade

Nunca use `navigator.onLine` sozinho:

```tsx
// ❌ Errado
if (navigator.onLine) {
  await supabase.from('table').insert(data);
}

// ✅ Correto
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  await offlineAdapter.put('table', data);
} else {
  const { error } = await budgetService.insert(data);
  if (error) {
    await offlineAdapter.put('table', data);
    await offlineAdapter.sync.add({ type: 'entity', action: 'insert', data });
  }
}
```

### IDs Offline

IDs offline têm prefixo `offline-`. Sempre verifique antes de operações cloud:

```tsx
if (offlineAdapter.isOfflineId(id)) {
  // Operação local apenas
}
```

---

## ⛔ O Que NÃO Fazer

| ❌ Não Faça | ✅ Faça Assim |
|-------------|---------------|
| Chamar Supabase de componentes | Use hooks que usam `storageAdapter` |
| `navigator.onLine` sozinho | Verifique `offlineAdapter.isOfflineId()` primeiro |
| Arquivos na raiz de `lib/` ou `components/` | Use subpastas por domínio |
| Inventar sufixos de componentes | Use a taxonomia documentada |
| `export default` | Use named exports |
| Múltiplos componentes por arquivo | Um componente por arquivo |
| `any` em tipos | Use `unknown` ou tipos específicos |
| `console.*` | Use `logger.*` |

---

## 🛠️ Comandos

```bash
npm run dev       # Dev server (localhost:8080)
npm run build     # Build de produção
npm run lint      # ESLint (deve passar com zero warnings)
npm run preview   # Preview do build de produção
```

---

*Se algo parecer errado ou inseguro, provavelmente é. Pergunte antes de fazer.*
