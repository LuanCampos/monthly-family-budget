# Padrões de UI - Monthly Family Budget

> **⚠️ OBRIGATÓRIO**: Todo componente DEVE seguir estes padrões.

---

## 📐 Layout & Breakpoints

### Hierarquia
```
App → Header → Main Content (Cards, Listas, Modais) → Footer
```

### Breakpoints Responsivos

> ⚠️ **ATENÇÃO**: Breakpoint `xs:` customizado em **900px** (não é padrão Tailwind).

| Prefixo | Valor | Uso |
|---------|-------|-----|
| (default) | < 640px | Mobile |
| `sm:` | ≥ 640px | Tablet portrait |
| `md:` | ≥ 768px | Tablet landscape |
| `xs:` | ≥ 900px | Transição mobile/desktop |
| `lg:` | ≥ 1024px | Desktop |
| `xl:` | ≥ 1280px | Desktop grande |

**REGRA: Mobile-first sempre** → `className="text-sm sm:text-base"` ✅

---

## 🎨 Sistema de Cores

### Tokens Obrigatórios

| Uso | Token |
|-----|-------|
| Fundo página | `bg-background` |
| Fundo cards/modais | `bg-card` |
| Fundo inputs | `bg-secondary/50` |
| Fundo list items | `bg-secondary/30` |
| Texto principal | `text-foreground` |
| Texto secundário | `text-muted-foreground` |
| Texto destaque | `text-primary` |
| Texto erro | `text-destructive` |
| Texto sucesso | `text-success` |
| Texto aviso | `text-warning` |
| Bordas | `border-border` |

**PROIBIDO**: Cores hardcoded (`text-gray-500`, `bg-slate-100`, `text-amber-500`)

### Cores de Categoria (CSS vars)
```css
--category-custos-fixos: 187 85% 53%;   /* Ciano */
--category-conforto: 160 84% 39%;       /* Verde */
--category-metas: 48 96% 53%;           /* Amarelo */
--category-prazeres: 291 64% 42%;       /* Roxo */
--category-liberdade: 217 91% 60%;      /* Azul */
--category-conhecimento: 25 95% 53%;    /* Laranja */
```

---

## 📦 Componentes Base

```tsx
// SEMPRE importe de @/components/ui/
import { Button, Input, Label, Checkbox, Badge } from '@/components/ui/...';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
```

---

## 🪟 Modais (Dialog)

### Estrutura Visual
```
┌─ HEADER ────────────────────────────┐  px-6 pt-6 pb-4 border-b
│  Ícone (h-5 w-5 text-primary) + Título
├─ CONTEÚDO ──────────────────────────┤  px-6 py-4 overflow-y-auto
│  space-y-2 para campos
├─ FOOTER ────────────────────────────┤  px-6 py-4 border-t bg-secondary/30
│  [Cancelar outline] [Salvar default]
└─────────────────────────────────────┘
```

### Código Padrão
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
      <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {t('title')}
      </DialogTitle>
      {/* NÃO usar DialogDescription aqui */}
    </DialogHeader>
    
    <div className="px-6 py-4 overflow-y-auto">
      <div className="space-y-2">{/* Campos */}</div>
    </div>
    
    <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
      <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
      <Button onClick={onSave}>{t('save')}</Button>
    </div>
  </DialogContent>
</Dialog>
```

### Tamanhos de Modal
| Tamanho | Classe | Uso |
|---------|--------|-----|
| Pequeno | `sm:max-w-sm` | Confirmações |
| **Médio** | `sm:max-w-md` | **Padrão** |
| Grande | `sm:max-w-lg` | Forms complexos |
| Extra | `sm:max-w-xl` | Listas |
| Máximo | `sm:max-w-2xl` | Goals |

### AlertDialog (Confirmações)

> **💡 RECOMENDAÇÃO**: Use `ConfirmDialog` de `@/components/common` para confirmações simples.
> Só use AlertDialog diretamente quando precisar de `AlertDialogTrigger` ou lógica especial.

**ConfirmDialog (preferido):**
```tsx
import { ConfirmDialog } from '@/components/common';

<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  onConfirm={handleDelete}
  title={t('confirmDelete')}
  description={t('deleteWarning')}
  variant="destructive"  // | "warning" | "default"
  confirmText={t('delete')}
/>
```

**AlertDialog manual (casos especiais):**
```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent className="bg-card border-border sm:max-w-sm">
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        {t('confirmDelete')}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-muted-foreground">
        {t('deleteWarning')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        {t('delete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Variants e ícones:**
| Variant | Ícone | Cor título | Botão ação |
|---------|-------|------------|------------|
| `destructive` | `Trash2` | `text-destructive` | `bg-destructive` |
| `warning` | `AlertTriangle` | `text-warning` | `bg-primary` |
| `default` | `AlertCircle` | `text-primary` | `bg-primary` |

---

## 📝 Formulários

**REGRA: Espaçamento `space-y-2` entre campos**

### Input Padrão
```tsx
<div className="space-y-1.5">
  <Label htmlFor="name" className="text-sm font-medium">{t('name')}</Label>
  <Input id="name" value={value} onChange={(e) => setValue(e.target.value)}
         className="h-10 bg-secondary/50 border-border" />
</div>
```

### Input com Prefixo (Moeda)
```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
  <Input type="text" inputMode="decimal" className="h-10 pl-10 bg-secondary/50 border-border" />
</div>
```

### Input com Erro
```tsx
<Input className={cn("h-10 bg-secondary/50 border-border", hasError && "border-destructive focus-visible:ring-destructive")} />
{hasError && (
  <p className="text-sm text-destructive flex items-center gap-1.5">
    <AlertCircle className="h-4 w-4" />{errorMessage}
  </p>
)}
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

### Checkbox
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="check" checked={checked} onCheckedChange={(c) => setChecked(c === true)} />
  <label htmlFor="check" className="text-sm font-medium leading-none cursor-pointer">{t('label')}</label>
</div>
```

### Textarea
```tsx
<Textarea className="min-h-24 bg-secondary/50 border-border resize-none" />
```

### Grid 2 Colunas
```tsx
<div className="grid grid-cols-2 gap-3">{/* campos lado a lado */}</div>
```

---

## 🔘 Botões

### Variantes
| Variante | Uso |
|----------|-----|
| `default` | Ação principal |
| `destructive` | Deletar |
| `outline` | Cancelar (secundário) |
| `secondary` | Alternativas |
| `ghost` | Ícones, sutis |
| `link` | Links inline |

### Tamanhos
| Size | Classes | Uso |
|------|---------|-----|
| `default` | `h-10 px-4` | Padrão |
| `sm` | `h-9 px-3` | Modais |
| `compact` | `h-8 px-2.5` | Toolbars |
| `lg` | `h-11 px-8` | CTAs |
| `icon` | `h-10 w-10` | Apenas ícone |

### Botão com Ícone
```tsx
<Button className="gap-2"><Plus className="h-4 w-4" />{t('create')}</Button>
```

### Botões de Ação em Listas (h-9 w-9)
```tsx
<Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
  <Pencil className="h-4 w-4" />
</Button>
<Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Botão Loading
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? t('saving') : t('save')}
</Button>
```

---

## 🎴 Cards

### Dashboard Card
```tsx
<div className="dashboard-card">
  <div className="dashboard-card-header">
    <h3 className="dashboard-card-title">{t('title')}</h3>
  </div>
  <div className="dashboard-card-content">{/* Conteúdo */}</div>
</div>
```

### Stat Card
```tsx
<div className="stat-card">
  <span className="stat-value">{formatCurrency(value)}</span>
  <span className="stat-label">{t('label')}</span>
</div>
```

---

## 📋 Listas

### List Item Padrão
```tsx
<div className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg group transition-colors">
  <div className="flex items-center gap-2.5 min-w-0 flex-1">
    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    <span className="text-sm text-foreground font-medium truncate">{name}</span>
  </div>
  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
    <span className="text-sm text-foreground font-semibold tabular-nums">{formatCurrency(amount)}</span>
    <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      {/* Botões edit/delete */}
    </div>
  </div>
</div>
```

### Empty State
```tsx
<div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-secondary/20">
  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
    <Icon className="h-6 w-6 text-primary" />
  </div>
  <p className="text-base font-semibold text-foreground mt-3">{t('noItems')}</p>
  <p className="text-sm text-muted-foreground">{t('createFirst')}</p>
  <Button className="mt-4 gap-2"><Plus className="h-4 w-4" />{t('create')}</Button>
</div>
```

---

## 🏷️ Badges & Tags

```tsx
<Badge variant="default|secondary|destructive|outline">{label}</Badge>
<span className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground">{tag}</span>
```

---

## 💬 Feedback (Toast)

```tsx
import { toast } from '@/hooks/ui/use-toast';
toast({ title: t('success'), description: t('saved') });
toast({ title: t('error'), description: error.message, variant: 'destructive' });
```

---

## 🔤 Ícones (Lucide React)

| Contexto | Tamanho |
|----------|---------|
| Botões texto | `h-4 w-4` |
| Títulos modal | `h-5 w-5 text-primary` |
| Empty states | `h-6 w-6 text-primary` |
| Hero | `h-8 w-8` ou `h-10 w-10` |

---

## 📏 Espaçamentos & Bordas

| Contexto | Classe |
|----------|--------|
| Entre campos | `space-y-2` |
| Entre seções | `space-y-4` |
| Modal content | `px-6 py-4` |
| Modal header | `px-6 pt-6 pb-4` |
| Modal footer | `px-6 py-4` |
| Gap flex | `gap-2` / `gap-3` |
| Borda padrão | `border border-border` |
| Separadores | `border-b border-border` / `border-t border-border` |
| Empty state | `border-2 border-dashed border-border` |
| Radius | `rounded-lg` (padrão), `rounded-md`, `rounded-full` |

---

## 🎯 Classes CSS Customizadas

| Classe | Uso |
|--------|-----|
| `.dashboard-card` | Seções principais |
| `.dashboard-card-header/title/content` | Estrutura de seção |
| `.stat-card` / `.stat-value` / `.stat-label` | Cards de estatística |
| `.touch-target` | Min 44x44px mobile |
| `.text-category-*` / `.bg-category-*` | Cores por categoria |

---

## ✅ Checklist de Revisão

### Modal
- [ ] Header: ícone + título, `px-6 pt-6 pb-4 border-b`
- [ ] **SEM** DialogDescription (exceto AlertDialog)
- [ ] Footer: `px-6 py-4 border-t bg-secondary/30`
- [ ] Cancelar = `variant="outline"`

### Formulários
- [ ] `space-y-2` entre campos
- [ ] Inputs: `h-10 bg-secondary/50 border-border`
- [ ] Labels: `text-sm font-medium`
- [ ] Erros: `text-sm text-destructive` + ícone

### Listas
- [ ] Items: `bg-secondary/30 hover:bg-secondary/50`
- [ ] Botões ação: `h-9 w-9`
- [ ] Hover para ações em desktop

### Geral
- [ ] Cores semânticas (tokens)
- [ ] Ícones Lucide React
- [ ] Textos via `t()`
- [ ] Mobile-first
