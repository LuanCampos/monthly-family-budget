# Guia para Iniciantes — Monthly Family Budget

Bem-vindo! Este documento explica o que é essa aplicação e como você pode contribuir.

---

## 🎯 O que é essa aplicação?

É um **app de controle financeiro familiar** que funciona no navegador. Permite:

- Registrar receitas (salários, freelances, etc.)
- Registrar despesas por categoria
- Criar metas de economia
- Acompanhar o orçamento mês a mês
- Funcionar mesmo sem internet (offline)

---

## 🛠️ Tecnologias Usadas

| Tecnologia | Para quê serve |
|------------|----------------|
| **React** | Criar a interface (botões, formulários, etc.) |
| **TypeScript** | JavaScript com tipos (menos bugs) |
| **Vite** | Servidor de desenvolvimento rápido |
| **Tailwind CSS** | Estilizar componentes com classes |
| **shadcn/ui** | Componentes prontos (botões, modais, inputs) |
| **Supabase** | Banco de dados na nuvem |
| **IndexedDB** | Banco de dados local (para funcionar offline) |

---

## 📁 Estrutura de Pastas

```
src/
├── components/     → Componentes visuais (botões, cards, modais)
│   ├── common/     → Componentes genéricos (ConfirmDialog, LimitsPanel)
│   ├── expense/    → Tudo sobre despesas
│   ├── income/     → Tudo sobre receitas
│   ├── goal/       → Tudo sobre metas
│   ├── recurring/  → Despesas recorrentes
│   ├── settings/   → Configurações
│   ├── subcategory/→ Subcategorias
│   └── ui/         → Componentes base shadcn/ui (Button, Input, Dialog)
│
├── hooks/          → Lógica reutilizável (useBudget, useGoals)
├── pages/          → Páginas da aplicação (Budget, Goals)
├── contexts/       → Estado global (Auth, Theme, Language, Currency)
├── lib/            → Utilitários e conexão com banco
│   ├── services/   → Funções que falam com Supabase (baixo nível)
│   ├── adapters/   → Decide se usa online ou offline
│   ├── storage/    → Acesso seguro ao localStorage
│   └── utils/      → Funções utilitárias (formatters, etc.)
├── i18n/           → Traduções (pt.ts, en.ts)
└── types/          → Definições de tipos TypeScript
```

---

## 🔄 Como os Dados Fluem

```
Usuário clica → Componente → Hook → Adapter → Banco de dados
                                      ↓
                              Online? → Supabase
                              Offline? → IndexedDB
```

**Exemplo:** Usuário adiciona uma despesa:
1. Clica no botão "Adicionar"
2. Componente `ExpenseFormDialog` aparece
3. Usuário preenche e salva
4. Hook `useBudget` é chamado
5. Adapter verifica se está online
6. Salva no Supabase (ou IndexedDB se offline)

---

## 📝 Tipos de Componentes

| Nome termina em... | O que faz | Exemplo |
|--------------------|-----------|---------|
| `*FormFields` | Campos de form reutilizáveis | `ExpenseFormFields` |
| `*FormDialog` | Modal para criar/editar algo | `ExpenseFormDialog` |
| `*ListDialog` | Modal com lista + ações | `SubcategoryListDialog` |
| `*SettingsDialog` | Modal complexo com tabs | `SettingsDialog` |
| `*Card` | Exibe informações resumidas | `GoalCard` |
| `*List` | Lista de itens (fora de modal) | `ExpenseList` |
| `*Panel` | Seção complexa autônoma | `RecurringExpensesPanel` |
| `*Chart` | Gráfico/visualização | `ExpenseChart` |
| `*Selector` | Seletor inline | `YearSelector` |

> **Dica:** Para confirmações de exclusão, use sempre `ConfirmDialog` de `@/components/common`.

---

## 🚀 Comandos Básicos

```bash
# Instalar dependências (só na primeira vez)
npm install

# Rodar em desenvolvimento
npm run dev

# Verificar erros de código
npm run lint

# Criar versão de produção
npm run build
```

---

## ✅ Antes de Enviar Código

1. **Rode o lint:** `npm run lint` (deve ter 0 erros)
2. **Rode o build:** `npm run build` (deve funcionar)
3. **Use os padrões:** Leia o `CONTRIBUTING.md` se for fazer algo novo

---

## 🎨 Dicas de Estilo

### Cores — Use tokens, não valores fixos

```tsx
// ❌ Errado
<div className="bg-gray-100 text-gray-600">

// ✅ Certo
<div className="bg-secondary/50 text-muted-foreground">
```

**Tokens mais usados:**
- `bg-card` → fundo de cards/modais
- `bg-secondary/50` → fundo de inputs
- `text-foreground` → texto principal
- `text-muted-foreground` → texto secundário
- `border-border` → todas as bordas

### Inputs sempre assim

```tsx
<Input className="h-10 bg-secondary/50 border-border" />
```

### Nunca use console.log

```tsx
// ❌ Errado
console.log('dados:', data);

// ✅ Certo
import { logger } from '@/lib/logger';
logger.debug('expense.created', { expenseId, amount });
```

### Nunca use localStorage diretamente

```tsx
// ❌ Errado
localStorage.getItem('key');

// ✅ Certo
import { getSecureStorageItem } from '@/lib/storage/secureStorage';
getSecureStorageItem('key');
```

---

## ❓ Dúvidas Comuns

**P: Onde crio um componente novo?**
R: Na pasta do domínio (`expense/`, `income/`, `goal/`). Se for genérico, em `common/`.

**P: Como adiciono texto traduzível?**
R: Em `src/i18n/translations/pt.ts` e `en.ts`. Use a mesma chave nos dois arquivos, na mesma ordem.

**P: Posso usar `any` no TypeScript?**
R: Não. Use `unknown` ou o tipo específico.

**P: Como testo se funciona offline?**
R: No Chrome DevTools → Network → marque "Offline".

**P: Posso usar `export default`?**
R: Não. Use sempre named exports: `export const MeuComponente = ...`

**P: Como faço um modal de confirmação?**
R: Use o `ConfirmDialog` de `@/components/common`. Nunca crie um novo.

**P: Posso chamar Supabase direto do componente?**
R: Não. Use hooks (`useBudget`, `useGoals`) que acessam os adapters.

**P: Como mostro mensagens de sucesso/erro?**
R: Use `toast.success(t('mensagem'))` ou `toast.error(t('erro'))` do Sonner.

**P: Preciso colocar `aria-label` em botões?**
R: Sim, em botões que só têm ícone (sem texto visível).

---

## 📚 Próximos Passos

1. Rode `npm run dev` e explore a aplicação em `http://localhost:8080`
2. Leia o código de um componente simples como `GoalCard.tsx`
3. Tente fazer uma pequena alteração visual
4. Rode `npm run lint` para verificar se está tudo certo
5. Leia o [`CONTRIBUTING.md`](../CONTRIBUTING.md) completo quando for criar algo novo

---

*Boa sorte! Se tiver dúvidas, pergunte. 🚀*
