# Padrões de UI - Monthly Family Budget

Este documento define os padrões visuais e de implementação para garantir consistência em toda a aplicação.

> **⚠️ OBRIGATÓRIO**: Todo componente DEVE seguir estes padrões. Ao revisar o código, corrija qualquer desvio.

---

## 📐 Estrutura de Layout

### Hierarquia de Componentes

```
App
├── Header (navbar com logo, navegação, settings)
├── Main Content
│   ├── Dashboard Cards (seções principais)
│   ├── Listas de itens (expenses, recurring, goals)
│   └── Modais (sobrepondo conteúdo)
└── Footer (opcional)
```

### Breakpoints Responsivos

> ⚠️ **ATENÇÃO**: O projeto usa um breakpoint `xs:` customizado em **900px**.

| Breakpoint | Prefixo | Valor | Uso |
|------------|---------|-------|-----|
| (default) | - | < 640px | Mobile |
| `sm:` | sm | ≥ 640px | Tablet portrait |
| `md:` | md | ≥ 768px | Tablet landscape |
| `xs:` | xs | ≥ 900px | Transição mobile/desktop |
| `lg:` | lg | ≥ 1024px | Desktop |
| `xl:` | xl | ≥ 1280px | Desktop grande |

**REGRA: Mobile-first sempre**

```tsx
// ✅ CORRETO
className="text-sm sm:text-base"
className="hidden xs:inline"
className="p-3 sm:p-4"

// ❌ ERRADO
className="text-base sm:text-sm"
```

---

## 🎨 Sistema de Cores

### Variáveis CSS (index.css)

```css
:root {
  --background: 30 6% 9%;
  --foreground: 40 20% 95%;
  --card: 30 6% 12%;
  --card-hover: 30 6% 14%;
  --primary: 43 74% 49%;        /* Dourado - ações principais */
  --secondary: 30 6% 18%;
  --muted: 30 6% 20%;
  --muted-foreground: 40 10% 60%;
  --destructive: 0 72% 51%;     /* Vermelho - perigo */
  --success: 142 71% 45%;       /* Verde - sucesso */
  --border: 30 6% 22%;
  --input: 30 6% 18%;
  --ring: 43 74% 49%;
}
```

### Cores de Categoria

```css
--category-custos-fixos: 187 85% 53%;   /* Ciano */
--category-conforto: 160 84% 39%;       /* Verde */
--category-metas: 48 96% 53%;           /* Amarelo */
--category-prazeres: 291 64% 42%;       /* Roxo */
--category-liberdade: 217 91% 60%;      /* Azul */
--category-conhecimento: 25 95% 53%;    /* Laranja */
```

### Tokens Obrigatórios

| Uso | Token | Exemplo |
|-----|-------|---------|
| Fundo da página | `bg-background` | - |
| Fundo de cards/modais | `bg-card` | - |
| Fundo de inputs | `bg-secondary/50` | `<Input className="bg-secondary/50" />` |
| Fundo de list items | `bg-secondary/30` | `<div className="bg-secondary/30">` |
| Texto principal | `text-foreground` | - |
| Texto secundário | `text-muted-foreground` | Labels, placeholders |
| Texto de destaque | `text-primary` | Links, valores importantes |
| Texto de erro | `text-destructive` | Mensagens de erro |
| Texto de sucesso | `text-success` | Valores positivos |
| Bordas | `border-border` | Padrão |
| Bordas sutis | `border-border/50` | Headers de seção |

**PROIBIDO**: Usar cores hardcoded como `text-gray-500`, `bg-slate-100`, etc.

---

## 📦 Componentes Base

### Importações

```tsx
// SEMPRE importe de @/components/ui/
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction, 
  AlertDialogCancel 
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
```

---

## 🪟 Modais (Dialog)

### Estrutura Obrigatória

Todo modal segue **exatamente** esta estrutura:

```
┌─────────────────────────────────────┐
│  HEADER                             │
│  ├─ Ícone + Título                  │
│  └─ (sem descrição)                 │
├─────────────────────────────────────┤  ← border-b border-border
│                                     │
│  CONTEÚDO                           │
│                                     │
├─────────────────────────────────────┤  ← border-t border-border
│  FOOTER (botões)                    │
└─────────────────────────────────────┘
```

### Código Padrão de Modal

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
    
    {/* ═══ HEADER ═══ */}
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
      <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {t('title')}
      </DialogTitle>
      {/* NÃO usar DialogDescription aqui */}
    </DialogHeader>
    
    {/* ═══ CONTEÚDO ═══ */}
    <div className="px-6 py-4 overflow-y-auto">
      <div className="space-y-2">
        {/* Campos do formulário */}
      </div>
    </div>
    
    {/* ═══ FOOTER ═══ */}
    <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
      <Button variant="outline" onClick={onClose}>
        {t('cancel')}
      </Button>
      <Button onClick={onSave}>
        {t('save')}
      </Button>
    </div>
    
  </DialogContent>
</Dialog>
```

### Regras do Header

| Elemento | Obrigatório | Classes |
|----------|-------------|---------|
| Container | ✅ | `px-6 pt-6 pb-4 border-b border-border` |
| Ícone | ✅ | `h-5 w-5 text-primary` |
| Título | ✅ | `flex items-center gap-2 text-lg font-semibold` |
| Descrição | ❌ | Apenas em AlertDialog |

### Regras do Footer

| Elemento | Classes |
|----------|---------|
| Container | `px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end` |
| Botão Cancelar | `variant="outline"` |
| Botão Primário | `variant="default"` (sem especificar) |
| Botão Destrutivo | `variant="destructive"` (à esquerda, separado) |

### Tamanhos de Modal

| Tamanho | Classe | Uso |
|---------|--------|-----|
| Pequeno | `sm:max-w-sm` | Confirmações simples |
| Médio | `sm:max-w-md` | **Padrão** - Formulários |
| Grande | `sm:max-w-lg` | Formulários complexos |
| Extra | `sm:max-w-xl` | Listas, tabelas |
| Máximo | `sm:max-w-2xl` | Goals, conteúdo extenso |

### AlertDialog (Confirmações)

**ÚNICO caso onde DialogDescription é obrigatória:**

```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent className="bg-card border-border sm:max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        {t('confirmDelete')}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-muted-foreground">
        {t('deleteWarning')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
      <AlertDialogAction 
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {t('delete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📝 Formulários

### Espaçamento Entre Campos

**REGRA: Sempre `space-y-2`** (8px entre campos)

```tsx
<div className="space-y-2">
  {/* Campo 1 */}
  {/* Campo 2 */}
  {/* Campo 3 */}
</div>
```

### Input Padrão

```tsx
<div className="space-y-1.5">
  <Label htmlFor="name" className="text-sm font-medium">
    {t('name')}
  </Label>
  <Input
    id="name"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={t('namePlaceholder')}
    className="h-10 bg-secondary/50 border-border"
  />
</div>
```

### Input com Prefixo (Moeda)

```tsx
<div className="space-y-1.5">
  <Label htmlFor="amount">{t('amount')}</Label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
      {currencySymbol}
    </span>
    <Input
      id="amount"
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      className="h-10 pl-10 bg-secondary/50 border-border"
    />
  </div>
</div>
```

### Input com Erro

```tsx
<div className="space-y-1.5">
  <Label htmlFor="email">{t('email')}</Label>
  <Input
    id="email"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className={cn(
      "h-10 bg-secondary/50 border-border",
      hasError && "border-destructive focus-visible:ring-destructive"
    )}
  />
  {hasError && (
    <p className="text-sm text-destructive flex items-center gap-1.5">
      <AlertCircle className="h-4 w-4" />
      {errorMessage}
    </p>
  )}
</div>
```

### Select

```tsx
<div className="space-y-1.5">
  <Label>{t('category')}</Label>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger className="h-10 bg-secondary/50 border-border">
      <SelectValue placeholder={t('selectCategory')} />
    </SelectTrigger>
    <SelectContent className="bg-card border-border">
      <SelectItem value="option1">{t('option1')}</SelectItem>
      <SelectItem value="option2">{t('option2')}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Checkbox

```tsx
<div className="flex items-center space-x-2">
  <Checkbox
    id="remember"
    checked={checked}
    onCheckedChange={(checked) => setChecked(checked === true)}
  />
  <label
    htmlFor="remember"
    className="text-sm font-medium leading-none cursor-pointer"
  >
    {t('rememberMe')}
  </label>
</div>
```

### Textarea

```tsx
<div className="space-y-1.5">
  <Label htmlFor="notes">{t('notes')}</Label>
  <Textarea
    id="notes"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={t('notesPlaceholder')}
    className="min-h-24 bg-secondary/50 border-border resize-none"
  />
</div>
```

### Grid de Formulário

```tsx
// Duas colunas lado a lado
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
    <Label>{t('field1')}</Label>
    <Input className="h-10 bg-secondary/50 border-border" />
  </div>
  <div className="space-y-1.5">
    <Label>{t('field2')}</Label>
    <Input className="h-10 bg-secondary/50 border-border" />
  </div>
</div>
```

---

## 🔘 Botões

### Variantes

| Variante | Uso | Classes Geradas |
|----------|-----|-----------------|
| `default` | Ação principal | `bg-primary text-primary-foreground` |
| `destructive` | Deletar, cancelar conta | `bg-destructive text-destructive-foreground` |
| `outline` | Ação secundária (Cancelar) | `border border-input bg-background` |
| `secondary` | Ações alternativas | `bg-secondary text-secondary-foreground` |
| `ghost` | Ícones, ações sutis | `hover:bg-muted/50` |
| `link` | Links inline | `text-primary underline` |

### Tamanhos

| Size | Uso | Classes |
|------|-----|---------|
| `default` | Padrão | `h-10 px-4` |
| `sm` | Em modais | `h-9 px-3` |
| `compact` | Toolbars | `h-8 px-2.5` |
| `lg` | CTAs destacados | `h-11 px-8` |
| `icon` | Apenas ícone | `h-10 w-10` |

### Botão com Ícone

```tsx
<Button className="gap-2">
  <Plus className="h-4 w-4" />
  {t('create')}
</Button>
```

### Botão de Ícone (Ações em Listas)

**REGRA: Tamanho `h-9 w-9` para touch target adequado**

```tsx
// Editar
<Button 
  variant="ghost" 
  size="icon" 
  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
>
  <Pencil className="h-4 w-4" />
</Button>

// Deletar
<Button 
  variant="ghost" 
  size="icon" 
  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### Botão com Loading

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? t('saving') : t('save')}
</Button>
```

---

## 🎴 Cards

### Dashboard Card (Seções da Página)

Usar classe customizada `.dashboard-card`:

```tsx
<div className="dashboard-card">
  <div className="dashboard-card-header">
    <h3 className="dashboard-card-title">{t('sectionTitle')}</h3>
    <Button variant="ghost" size="icon" className="h-9 w-9">
      <Settings className="h-4 w-4" />
    </Button>
  </div>
  <div className="dashboard-card-content">
    {/* Conteúdo */}
  </div>
</div>
```

### Stat Card (Estatísticas)

```tsx
<div className="stat-card">
  <span className="stat-value">{formatCurrency(value)}</span>
  <span className="stat-label">{t('totalExpenses')}</span>
</div>
```

---

## 📋 Listas

### List Item Padrão

```tsx
<div className="space-y-1.5">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg group transition-colors"
    >
      {/* Lado esquerdo */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span 
          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
          style={{ backgroundColor: item.color }} 
        />
        <span className="text-sm text-foreground font-medium truncate">
          {item.name}
        </span>
      </div>
      
      {/* Lado direito */}
      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
        <span className="text-sm text-foreground font-semibold tabular-nums">
          {formatCurrency(item.amount)}
        </span>
        
        {/* Ações - visíveis em mobile, hover em desktop */}
        <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Empty State

```tsx
<div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-secondary/20">
  <div className="flex flex-col items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div className="space-y-1">
      <p className="text-base font-semibold text-foreground">{t('noItems')}</p>
      <p className="text-sm text-muted-foreground">{t('createFirst')}</p>
    </div>
    <Button className="mt-2 gap-2">
      <Plus className="h-4 w-4" />
      {t('create')}
    </Button>
  </div>
</div>
```

---

## 🏷️ Tags e Badges

### Badge

```tsx
<Badge variant="default">{t('active')}</Badge>
<Badge variant="secondary">{t('pending')}</Badge>
<Badge variant="destructive">{t('error')}</Badge>
<Badge variant="outline">{t('draft')}</Badge>
```

### Tag em List Item

```tsx
<span className="text-xs px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground">
  {tagLabel}
</span>
```

---

## 💬 Feedback

### Toast

```tsx
import { toast } from '@/hooks/ui/use-toast';

// Sucesso
toast({
  title: t('success'),
  description: t('itemSaved'),
});

// Erro
toast({
  title: t('error'),
  description: error.message,
  variant: 'destructive',
});
```

### Erro Inline

```tsx
<p className="text-sm text-destructive flex items-center gap-1.5">
  <AlertCircle className="h-4 w-4" />
  {errorMessage}
</p>
```

---

## 🔤 Ícones

### Biblioteca: Lucide React

```tsx
import { Plus, Trash2, Pencil, Check, X, Settings, Loader2, AlertCircle } from 'lucide-react';
```

### Tamanhos

| Contexto | Classes |
|----------|---------|
| Em botões de texto | `h-4 w-4` |
| Em títulos de modal | `h-5 w-5 text-primary` |
| Em empty states | `h-6 w-6 text-primary` |
| Hero icons | `h-8 w-8` ou `h-10 w-10` |

---

## 📏 Espaçamentos

| Contexto | Classe |
|----------|--------|
| Entre campos de formulário | `space-y-2` |
| Entre seções | `space-y-4` |
| Padding de modal content | `px-6 py-4` |
| Padding de modal header | `px-6 pt-6 pb-4` |
| Padding de modal footer | `px-6 py-4` |
| Gap em flex | `gap-2` ou `gap-3` |

---

## 🧱 Bordas

| Contexto | Classe |
|----------|--------|
| Padrão | `border border-border` |
| Separadores (header/footer) | `border-b border-border` / `border-t border-border` |
| Sutil | `border-border/50` |
| Empty state | `border-2 border-dashed border-border` |
| Border radius padrão | `rounded-lg` |
| Border radius pequeno | `rounded-md` |
| Border radius circular | `rounded-full` |

---

## 🎯 Classes CSS Customizadas

| Classe | Arquivo | Uso |
|--------|---------|-----|
| `.dashboard-card` | index.css | Seções principais |
| `.dashboard-card-header` | index.css | Header de seção |
| `.dashboard-card-title` | index.css | Título de seção |
| `.dashboard-card-content` | index.css | Conteúdo de seção |
| `.stat-card` | index.css | Card de estatística |
| `.stat-value` | index.css | Valor em stat-card |
| `.stat-label` | index.css | Label em stat-card |
| `.touch-target` | index.css | Min 44x44px em mobile |
| `.text-category-*` | index.css | Cor de texto por categoria |
| `.bg-category-*` | index.css | Cor de fundo por categoria |

---

## ✅ Checklist de Revisão

Ao revisar um componente, verifique:

### Modal
- [ ] Header tem ícone + título
- [ ] Header usa `px-6 pt-6 pb-4 border-b border-border`
- [ ] NÃO tem DialogDescription (exceto AlertDialog)
- [ ] Footer usa `px-6 py-4 border-t border-border bg-secondary/30`
- [ ] Botão Cancelar é `variant="outline"`

### Formulários
- [ ] Espaçamento entre campos é `space-y-2`
- [ ] Inputs usam `h-10 bg-secondary/50 border-border`
- [ ] Labels usam `text-sm font-medium`
- [ ] Erros usam `text-sm text-destructive` com ícone

### Listas
- [ ] Items usam `bg-secondary/30 hover:bg-secondary/50`
- [ ] Botões de ação usam `h-9 w-9`
- [ ] Ações aparecem em hover no desktop

### Geral
- [ ] Cores semânticas (não hardcoded)
- [ ] Ícones do Lucide React
- [ ] Textos via `t()`
- [ ] Mobile-first

---

*Última atualização: Janeiro 2026*
