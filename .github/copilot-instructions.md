# GitHub Copilot Instructions — Monthly Family Budget

## Stack & Arquitetura

**Stack:** Vite + React 18 + TypeScript + Supabase + IndexedDB

**Fluxo de dados (NUNCA viole):**
```
Componente → Hook → storageAdapter → Service (Supabase) / offlineAdapter (IndexedDB)
```

**Estrutura de arquivos:**
```
src/pages/                    → Páginas (Budget.tsx, Goals.tsx)
src/components/{domain}/      → Componentes por domínio (expense/, goal/, income/)
src/components/common/        → Componentes compartilhados (ConfirmDialog, LimitsPanel)
src/components/ui/            → Primitivos shadcn/ui (NÃO edite)
src/hooks/                    → Hooks de domínio (useBudget.ts, useGoals.ts)
src/lib/adapters/             → Abstração online/offline (storageAdapter.ts)
src/lib/services/             → Chamadas Supabase (baixo nível)
src/contexts/                 → Estado global (Auth, Theme, Language, Currency)
src/i18n/translations/        → pt.ts e en.ts (mesmas chaves, mesma ordem)
src/types/                    → Tipos TypeScript
```

---

## Regras Absolutas

```tsx
// ❌ PROIBIDO                          // ✅ OBRIGATÓRIO
export default Component                → export const Component
any                                     → unknown ou tipo específico
console.log()                           → logger.debug('event', { data })
localStorage.getItem()                  → getSecureStorageItem()
<DialogFooter>                          → <div className="...bg-secondary/30">
className="text-gray-500"               → className="text-muted-foreground"
className="bg-gray-100"                 → className="bg-secondary/50"
supabase.from('table')  // em componente → Use hook → adapter
navigator.onLine sozinho                → offlineAdapter.isOfflineId(id) || !navigator.onLine
```

---

## Templates de Código

### Dialog (FormDialog / ListDialog)

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
      <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {t('title')}
      </DialogTitle>
    </DialogHeader>
    
    <div className="px-6 py-4 overflow-y-auto">
      <div className="space-y-4">
        {/* campos aqui */}
      </div>
    </div>
    
    <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
      <Button variant="outline" onClick={handleClose}>{t('cancel')}</Button>
      <Button onClick={handleSave} disabled={saving}>{t('save')}</Button>
    </div>
  </DialogContent>
</Dialog>
```

**Tamanhos:** `sm:max-w-sm` (confirm) | `sm:max-w-md` (form) | `sm:max-w-lg` (form complexo) | `sm:max-w-xl` (lista)

### Campo de Formulário

```tsx
<div className="space-y-2">
  <Label htmlFor="fieldId" className="text-sm font-medium">{t('label')}</Label>
  <Input id="fieldId" className="h-10 bg-secondary/50 border-border" />
</div>
```

### Input com Moeda

```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">{t('value')}</Label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
      {currencySymbol}
    </span>
    <Input type="text" inputMode="decimal" className="h-10 pl-10 bg-secondary/50 border-border" />
  </div>
</div>
```

### Select

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="h-10 bg-secondary/50 border-border">
    <SelectValue placeholder={t('select')} />
  </SelectTrigger>
  <SelectContent className="bg-card border-border">
    <SelectItem value="opt1">{t('option1')}</SelectItem>
  </SelectContent>
</Select>
```

### Item de Lista com Ações

```tsx
<div className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg gap-3">
  <div className="min-w-0 flex-1">
    <p className="text-sm text-foreground truncate">{name}</p>
  </div>
  <div className="flex items-center gap-1 flex-shrink-0">
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
      aria-label={t('edit')}
    >
      <Pencil className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      aria-label={t('delete')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Confirmação de Exclusão

```tsx
import { ConfirmDialog } from '@/components/common';

<ConfirmDialog
  open={!!deleteId}
  onOpenChange={(open) => !open && setDeleteId(null)}
  onConfirm={() => handleDelete(deleteId)}
  title={t('deleteTitle')}
  description={t('deleteDescription')}
  variant="destructive"
  loading={deleting}
/>
```

### Imports Padrão

```tsx
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { logger } from '@/lib/logger';
import { getSecureStorageItem } from '@/lib/storage/secureStorage';
import { offlineAdapter } from '@/lib/adapters/offlineAdapter';
```

---

## Nomenclatura

| Sufixo | Quando usar |
|--------|-------------|
| `*FormFields` | Campos de form reutilizáveis (sem dialog) |
| `*FormDialog` | Dialog para criar/editar UMA entidade |
| `*ListDialog` | Dialog com lista + ações CRUD |
| `*SettingsDialog` | Dialog complexo com tabs/seções |
| `*Card` | Exibição compacta de entidade |
| `*List` | Lista de itens (fora de dialog) |
| `*Panel` | Seção autônoma complexa |
| `*Chart` | Visualização gráfica |
| `*Selector` | Picker inline |

**❌ Nunca use:** `*Manager`, `*Container`, `*Modal`, `*Form` (para dialogs), `*Wrapper`

---

## Tokens de Cor

| Contexto | Classe |
|----------|--------|
| Fundo de dialog/card | `bg-card` |
| Fundo de inputs | `bg-secondary/50` |
| Fundo de list items | `bg-secondary/50` |
| Footer de dialog | `bg-secondary/30` |
| Texto principal | `text-foreground` |
| Texto secundário | `text-muted-foreground` |
| Bordas | `border-border` |
| Ícone em título | `text-primary` |
| Ação destrutiva | `text-destructive` / `bg-destructive` |
| Hover editar | `hover:text-primary hover:bg-primary/10` |
| Hover deletar | `hover:text-destructive hover:bg-destructive/10` |

---

## Acessibilidade (a11y)

```tsx
// ✅ Botões de ícone SEMPRE com aria-label
<Button variant="ghost" size="icon" aria-label={t('edit')}>
  <Pencil className="h-4 w-4" />
</Button>

// ✅ Inputs pareados com Label
<Label htmlFor="name">{t('name')}</Label>
<Input id="name" ... />

// ✅ Imagens com alt
<img src={url} alt={t('description')} />
<img src={decorative} alt="" />  // Decorativa
```

---

## Tratamento de Erros

```tsx
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const handleSave = async () => {
  setLoading(true);
  try {
    await onSave(data);
    toast.success(t('saved'));
    onClose();
  } catch (error) {
    logger.error('entity.save.failed', { error });
    toast.error(t('errorSaving'));
  } finally {
    setLoading(false);
  }
};
```

| Situação | Ação |
|----------|------|
| Sucesso | `toast.success(t('mensagem'))` |
| Erro de usuário | `toast.error(t('erro'))` + `logger.error()` |
| Aviso | `toast.warning(t('aviso'))` |

---

## Performance

```tsx
// ✅ useMemo para cálculos pesados
const chartData = useMemo(() => 
  months.map(m => ({ label: m.label, value: m.total }))
, [months]);

// ✅ useCallback para funções passadas como props
const handleDelete = useCallback(async (id: string) => {
  await deleteItem(id);
}, [deleteItem]);
```

| Hook | Quando Usar |
|------|-------------|
| `useMemo` | Cálculos derivados de props/state |
| `useCallback` | Funções passadas para componentes filhos |
| Nenhum | Valores simples, funções locais |

---

## Testes

Arquivos de teste co-localizados com o código fonte.

### O que Testar (Prioridade)

| Tipo | Exemplo | Ação |
|------|---------|------|
| Novo utilitário em `src/lib/` | `formatters.ts` | ✅ Escrever teste |
| Novo validador/schema | `validators.ts` | ✅ Escrever teste |
| Função de segurança | `secureStorage.ts` | ✅ Escrever teste com payloads maliciosos |
| Ataques de segurança | `security.test.ts` | ✅ XSS, SQL Injection, Prototype Pollution, etc. |
| Novo componente | `ExpenseCard.tsx` | ⏳ Futuro |
| Novo hook | `useBudget.ts` | ⏳ Futuro (requer mocks complexos) |

### Convenções de Teste

```typescript
// Arquivo: arquivo.test.ts (co-localizado com arquivo.ts)
import { describe, it, expect, beforeEach } from 'vitest';

describe('nomeDoModulo', () => {
  beforeEach(() => {
    // setup/cleanup
  });

  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

---

## Checklist Antes de Finalizar

- [ ] Um componente por arquivo
- [ ] Named export (`export const`)
- [ ] Sem `any` — usar `unknown` ou tipo específico
- [ ] Sem `console.*` — usar `logger.*`
- [ ] Sem cores hardcoded — usar tokens
- [ ] Textos com `t('chave')` + chaves em pt.ts e en.ts
- [ ] Dialog sem `<DialogFooter>` — usar div estilizada
- [ ] Inputs com `h-10 bg-secondary/50 border-border`
- [ ] Botões de ícone com `aria-label`
- [ ] Operações async com try/catch + toast
- [ ] Cálculos pesados com `useMemo`
- [ ] Testes para novos utilitários/validadores
