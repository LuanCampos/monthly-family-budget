# Guia do Desenvolvedor — Monthly Family Budget

> **⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO**

Este documento é o **ponto de entrada** para todos os padrões do projeto. Contém resumos das regras mais importantes, mas **não substitui** a documentação detalhada.

---

## 📖 Estrutura da Documentação

| Documento | Quando Consultar |
|-----------|------------------|
| **Este arquivo** | ✅ **Sempre** — leia antes de qualquer alteração |
| [`docs/ui-standards.md`](docs/ui-standards.md) | Ao criar/modificar componentes visuais (modais, forms, listas, botões) |
| [`docs/security-instructions.md`](docs/security-instructions.md) | Ao lidar com dados sensíveis, localStorage, validação, ou autenticação |

> **Fluxo recomendado**: Leia este arquivo → Implemente → Consulte docs específicos conforme necessário → Verifique checklist abaixo

---

## 📋 Checklist Rápido

Antes de submeter código, verifique:

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] Sem `console.*` (use `logger` de `@/lib/logger`)
- [ ] Sem credenciais hardcoded
- [ ] Inputs validados com Zod
- [ ] Componentes seguem padrões de UI
- [ ] Arquivos nomeados corretamente

---

## 🏗️ Arquitetura

### Stack
**Vite + React + TypeScript + Supabase + IndexedDB** — App cloud-first com suporte offline.

### Fluxo de Dados
```
Component → Hook → storageAdapter → Service (Supabase) OU offlineAdapter (IndexedDB)
```

### Estrutura de Diretórios

| Camada | Path | Propósito |
|--------|------|-----------|
| **Services** | `src/lib/services/` | Wrappers do Supabase |
| **Adapters** | `src/lib/adapters/` | Lógica online/offline |
| **Hooks** | `src/hooks/` | Orquestração de estado |
| **Components** | `src/components/{domain}/` | UI por domínio |
| **Types** | `src/types/` | Tipos da app e do banco |
| **Contexts** | `src/contexts/` | Contextos React |
| **Pages** | `src/pages/` | Páginas/rotas |

---

## 📁 Nomenclatura de Arquivos

### Componentes (`src/components/`)

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| UI primitives (shadcn) | `kebab-case.tsx` | `button.tsx`, `dialog.tsx` |
| Componentes de domínio | `PascalCase.tsx` | `ExpenseForm.tsx`, `GoalCard.tsx` |
| Dialogs/Modais | `{Name}Dialog.tsx` | `EntryFormDialog.tsx` |
| Seções | `{Name}Section.tsx` | `ProfileSection.tsx` |
| Index | `index.tsx` | Re-exports do domínio |

### Hooks (`src/hooks/`)

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Domain hooks | `use{Domain}.ts` | `useBudget.ts`, `useGoals.ts` |
| UI hooks | `use-{name}.ts` | `use-mobile.ts`, `use-toast.ts` |

### Lib (`src/lib/`)

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Services | `{domain}Service.ts` | `budgetService.ts` |
| Adapters | `{domain}Adapter.ts` | `expenseAdapter.ts` |
| Utilities | `src/lib/utils/{name}.ts` | `formatters.ts` |
| Storage | `src/lib/storage/{name}.ts` | `secureStorage.ts` |

### Outros

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Pages | `PascalCase.tsx` | `Budget.tsx`, `Goals.tsx` |
| Contexts | `{Name}Context.tsx` | `AuthContext.tsx` |
| Types | `camelCase.ts` | `budget.ts`, `database.ts` |

### Regras Gerais
- **Named exports apenas** — sem `export default` (exceto pages)
- **Sufixo indica propósito**: `*Service`, `*Adapter`, `*Context`, `*Dialog`, `*Section`
- **Pasta por domínio** — quando >3 arquivos relacionados, criar subpasta

---

## 🔒 Segurança

> Detalhes completos: [`docs/security-instructions.md`](docs/security-instructions.md)

### Resumo das Regras

| ❌ Não | ✅ Sim |
|--------|--------|
| `console.log(x)` | `logger.debug('event', x)` |
| `const key = 'abc123'` | `import.meta.env.VITE_KEY` |
| `.insert(req.body)` | `.insert(validatedData)` via Zod |
| `localStorage.getItem(x)` | `getSecureStorageItem(x)` |
| `dangerouslySetInnerHTML` | Sanitizar ou evitar |

### Arquivos de Segurança
- `src/lib/logger.ts` — Logger estruturado (substitui console)
- `src/lib/storage/secureStorage.ts` — Acesso validado ao localStorage
- `src/lib/validators.ts` — Schemas Zod para inputs
- `src/lib/schemas.ts` — Schemas Zod para rows do banco

---

## 🎨 Padrões de UI

> Detalhes completos: [`docs/ui-standards.md`](docs/ui-standards.md)

### Regras Essenciais

1. **Cores**: Use tokens semânticos (`bg-background`, `text-foreground`, `text-primary`)
   - ❌ `text-gray-500` | ✅ `text-muted-foreground`

2. **Modals**: Estrutura padrão
   ```tsx
   <DialogContent className="bg-card border-border sm:max-w-md">
     <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
       <DialogTitle>...</DialogTitle>
     </DialogHeader>
     <div className="px-6 py-4">{/* conteúdo */}</div>
     <div className="px-6 py-4 border-t border-border bg-secondary/30">
       {/* botões */}
     </div>
   </DialogContent>
   ```

3. **Forms**: 
   - Espaçamento: `space-y-2` entre campos
   - Inputs: `h-10 bg-secondary/50 border-border`
   - Labels: `text-sm font-medium`

4. **Botões de Ação**: 
   - Cancelar: `variant="outline"`
   - Confirmar: `variant="default"`
   - Deletar: `variant="destructive"`

5. **Ícones**: Lucide React, tamanhos `h-4 w-4` (botões) ou `h-5 w-5` (títulos)

6. **Toast/Feedback**:
   ```tsx
   import { toast } from '@/hooks/ui/use-toast';
   toast({ title: t('success'), description: t('saved') });
   ```

---

## 🔄 Padrões de Código

### Offline-Safe (apenas em adapters)
```typescript
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  await offlineAdapter.put('table', data);
} else {
  const res = await budgetService.operation(data);
  if (res.error) {
    await offlineAdapter.put('table', data);
    await offlineAdapter.sync.add({ type, action, data, familyId });
  }
}
```

### Type Mapping (DB → App)
```typescript
// DB usa snake_case, App usa camelCase
// Use mappers em src/lib/mappers.ts — NUNCA inline
import { mapExpense } from '@/lib/mappers';
const expense = mapExpense(dbRow);
```

### Boolean Fields
```typescript
// ❌ installment_current: recurring.hasInstallments ?? undefined
// ✅ installment_current: recurring.hasInstallments ? value : null
```

### Modais com Dados (evitar flash)
```tsx
// ✅ Renderização condicional para evitar flash ao fechar
{editingItem && (
  <EditDialog open={Boolean(editingItem)} item={editingItem} />
)}
```

---

## ⛔ O Que NÃO Fazer

- Chamar Supabase diretamente de componentes — use hooks
- Usar `navigator.onLine` sozinho — verifique `offlineAdapter.isOfflineId()` primeiro
- Colocar arquivos na raiz de `lib/` ou `components/` — use subpastas
- Usar `console.*` — use `logger`
- Hardcodar credenciais ou tokens
- Usar cores hardcoded — use tokens semânticos
- Criar componentes sem seguir o padrão de nomenclatura

---

## 📚 Documentação Detalhada

Este documento contém **resumos**. Para detalhes completos, consulte:

| Documento | Conteúdo Detalhado |
|-----------|-------------------|
| [`docs/ui-standards.md`](docs/ui-standards.md) | Código completo de modais, breakpoints, cores CSS, tamanhos de botões, estrutura de listas, empty states |
| [`docs/security-instructions.md`](docs/security-instructions.md) | Exemplos completos de validação, comandos de auditoria, arquivos de segurança |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Contexto para assistentes AI |

---

## 🛠️ Comandos

```bash
npm run dev       # Servidor dev (localhost:8080)
npm run build     # Build de produção
npm run lint      # Verificar ESLint
npm audit         # Verificar vulnerabilidades
```

---

## 🔍 Verificações Antes do PR

```bash
# Build e lint devem passar
npm run build
npm run lint

# Verificar possíveis tokens hardcoded
grep -r "eyJ\|sk-" src/

# Verificar console.log esquecidos
grep -r "console\." src/ --include="*.ts" --include="*.tsx"
```

---

*Se algo parecer errado ou inseguro, provavelmente é. Pergunte antes de fazer.*
