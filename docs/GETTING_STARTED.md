# Guia para Iniciantes — Monthly Family Budget

Bem-vindo! Este documento explica **o que é essa aplicação**, **como ela funciona por dentro** e **como você pode começar a contribuir**.

---

## 📑 Índice

**Parte 1: Entendendo o Projeto**
1. [O que é essa aplicação?](#-o-que-é-essa-aplicação)
2. [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
3. [Arquitetura e Fluxo de Dados](#️-arquitetura-e-fluxo-de-dados)
4. [Estrutura de Pastas](#-estrutura-de-pastas)

**Parte 2: Começando a Desenvolver**
5. [Primeiros Passos](#-primeiros-passos)

**Parte 3: Padrões do Projeto**
6. [Padrões de Código](#-padrões-de-código)
7. [Testes e Qualidade](#-testes-e-qualidade)

**Parte 4: Referência**
8. [Troubleshooting](#-troubleshooting)
9. [Próximos Passos](#-próximos-passos)

---

# Parte 1: Entendendo o Projeto

## 🎯 O que é essa aplicação?

É um **app de controle financeiro familiar** que pode ser instalado no seu dispositivo. Permite:

- Registrar receitas e despesas por categoria
- Criar metas de economia
- Acompanhar o orçamento mês a mês
- **Funcionar offline** — dados salvos localmente, sincronizam quando voltar a internet
- **Instalar como app** no celular ou desktop (é um PWA)

---

## 🛠️ Tecnologias Utilizadas

### Frontend

| Tecnologia | Para quê serve |
|------------|----------------|
| **React** | Biblioteca para criar interfaces de usuário |
| **TypeScript** | JavaScript com tipos — erros aparecem antes de rodar |
| **Tailwind CSS** | Estilização com classes utilitárias (`bg-blue-500`, `p-4`) |
| **shadcn/ui** | Componentes prontos e acessíveis (botões, modais, inputs) |

### Backend e Dados

| Tecnologia | Para quê serve |
|------------|----------------|
| **Supabase** | Banco de dados e autenticação na nuvem |
| **IndexedDB** | Banco local do navegador (funciona offline) |

### Ferramentas de Desenvolvimento

| Tecnologia | Para quê serve |
|------------|----------------|
| **Vite** | Servidor de dev + bundler (compila tudo para produção) |
| **Vitest** | Framework de testes |

### Como funciona: do código ao navegador

O navegador **só entende HTML, CSS e JavaScript**. Então o **Vite** transforma tudo que você escreve:

| Você escreve | Navegador recebe |
|--------------|------------------|
| TypeScript (`.ts`) | JavaScript (tipos removidos) |
| JSX (`<Button />`) | JavaScript (`React.createElement(...)`) |
| Tailwind (classes) | CSS puro (só as classes usadas) |
| Vários arquivos | Poucos arquivos otimizados |

```
  DESENVOLVIMENTO                              PRODUÇÃO
  (npm run dev)                              (npm run build)

+------------------+                        +------------------+
| Component.tsx    |                        | index.js         |
| hooks.ts         |  ---- Vite ---->       | vendor.js        |
| utils.ts         |                        | index.css        |
| *.css            |                        | index.html       |
+------------------+                        +------------------+
  Muitos arquivos                             Poucos arquivos
  Código legível                              Minificados
  Com tipos TS                                Só JS/CSS/HTML
```

**Em desenvolvimento:** Vite sobe um servidor em `localhost:8080` com Hot Reload — ao salvar, o navegador atualiza sozinho.

**Em produção:** Vite gera a pasta `dist/` com tudo otimizado. O React vira JavaScript, o TypeScript perde os tipos, o Tailwind vira CSS puro.

> **Por que Vite?** É mais rápido que Webpack porque usa ES Modules nativos do navegador.

---

## 🏛️ Arquitetura e Fluxo de Dados

### Visão geral

```
+---------------------------------------------------------------+
|                          NAVEGADOR                            |
+---------------------------------------------------------------+
|                                                               |
|   +-------------------------------------------------------+   |
|   |                  REACT + TypeScript                   |   |
|   |                                                       |   |
|   |   +-----------+   +-----------+   +---------------+   |   |
|   |   |   Pages   |   |Components |   |   Contexts    |   |   |
|   |   | (Budget,  |   | (Cards,   |   | (Auth, Theme, |   |   |
|   |   |  Goals)   |   |  Dialogs) |   |  Language)    |   |   |
|   |   +-----------+   +-----------+   +---------------+   |   |
|   |                         |                             |   |
|   |                         v                             |   |
|   |   +-----------------------------------------------+   |   |
|   |   |                    HOOKS                      |   |   |
|   |   |          (useBudget, useGoals, etc.)          |   |   |
|   |   +-----------------------------------------------+   |   |
|   |                         |                             |   |
|   |                         v                             |   |
|   |   +-----------------------------------------------+   |   |
|   |   |              storageAdapter                   |   |   |
|   |   |           (decide online/offline)             |   |   |
|   |   +-----------------------------------------------+   |   |
|   |                    |              |                   |   |
|   |                    v              v                   |   |
|   |        +--------------+    +----------------+         |   |
|   |        |   Services   |    | offlineAdapter |         |   |
|   |        |  (Supabase)  |    |   (IndexedDB)  |         |   |
|   |        +--------------+    +----------------+         |   |
|   +-------------------------------------------------------+   |
|                    |                      |                   |
|                    v                      v                   |
|          +---------------+       +---------------+            |
|          |   SUPABASE    |       |   IndexedDB   |            |
|          |    (nuvem)    |       |    (local)    |            |
|          +---------------+       +---------------+            |
+---------------------------------------------------------------+
```

### Fluxo de dados (regra de ouro)

O fluxo **sempre** segue essa ordem — nunca viole:

```
+-----------+     +------+     +----------------+     +-------------------+
| Componente| --> | Hook | --> | storageAdapter | --> | Service / Offline |
|   (UI)    |     |      |     |                |     |     Adapter       |
+-----------+     +------+     +----------------+     +-------------------+
    React          Lógica       Decide online/          Supabase ou
                                  offline                IndexedDB
```

### Camadas do projeto

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Pages** | `src/pages/` | Páginas principais (Budget, Goals) |
| **Components** | `src/components/` | Peças visuais (botões, cards, dialogs) |
| **Hooks** | `src/hooks/` | Lógica de negócio (useBudget, useGoals) |
| **Contexts** | `src/contexts/` | Estado global (Auth, Theme, Language) |
| **Adapters** | `src/lib/adapters/` | Decide se usa online ou offline |
| **Services** | `src/lib/services/` | Chamadas diretas ao Supabase |

> ⚠️ **Regra de ouro:** Componentes NUNCA chamam Supabase diretamente. Sempre passam pelo hook → adapter.

### Exemplo: O que acontece ao adicionar uma despesa?

1. Usuário clica em "+" → abre `ExpenseFormDialog`
2. Preenche e clica "Salvar" → hook `useBudget` é chamado
3. Hook chama `storageAdapter.saveExpense()`
4. Adapter verifica `navigator.onLine`:
   - **Online** → `expenseService.create()` → Supabase
   - **Offline** → `offlineAdapter.saveExpense()` → IndexedDB
5. Toast de sucesso → `toast.success(t('saved'))`

---

## 📁 Estrutura de Pastas

```
src/
├── pages/          → Páginas da aplicação (Budget, Goals)
├── components/     → Componentes visuais
│   ├── common/     → Genéricos (ConfirmDialog, LimitsPanel)
│   ├── expense/    → Tudo sobre despesas
│   ├── income/     → Tudo sobre receitas
│   ├── goal/       → Tudo sobre metas
│   └── ui/         → Componentes shadcn/ui (NÃO edite)
│
├── hooks/          → Lógica reutilizável (useBudget, useGoals)
├── contexts/       → Estado global (Auth, Theme, Language, Currency)
├── lib/            → Utilitários e conexão com banco
│   ├── adapters/   → Decide se usa online ou offline
│   ├── services/   → Chamadas ao Supabase
│   └── storage/    → Acesso seguro ao localStorage
├── i18n/           → Traduções (pt.ts, en.ts)
└── types/          → Definições TypeScript
```

### Convenção de nomenclatura de componentes

| Sufixo | O que faz | Exemplo |
|--------|-----------|---------|
| `*FormDialog` | Modal para criar/editar | `ExpenseFormDialog` |
| `*ListDialog` | Modal com lista + ações | `SubcategoryListDialog` |
| `*Card` | Exibe informações resumidas | `GoalCard` |
| `*List` | Lista de itens | `ExpenseList` |
| `*Panel` | Seção complexa autônoma | `RecurringExpensesPanel` |

> ⚠️ Para confirmações de exclusão, use sempre `ConfirmDialog` de `@/components/common`.

---

# Parte 2: Começando a Desenvolver

## 🚀 Primeiros Passos

### 1. Clone e instale

```bash
git clone <url-do-repositorio>
cd monthly-family-budget
npm install
```

### 2. Configure o Supabase

Crie um projeto gratuito em [supabase.com](https://supabase.com) e copie as chaves.

Crie o arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

> ⚠️ **Nunca commite o `.env.local`** — ele já está no `.gitignore`.

### 3. Rode o projeto

```bash
npm run dev
```

Abra `http://localhost:8080` no navegador.

### 4. Comandos úteis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run lint      # Verifica erros de código
npm run test:run  # Roda todos os testes
npm run test      # Roda testes em modo watch
npm run build     # Gera versão de produção
```

### 5. Antes de enviar código (PR)

Sempre rode os três comandos abaixo — todos devem passar:

```bash
npm run test:run  # Testes passando
npm run lint      # Zero warnings
npm run build     # Build sem erros
```

---

# Parte 3: Padrões do Projeto

## 📐 Padrões de Código

### Estilo visual: Use tokens, não cores fixas

```tsx
// ❌ Errado
<div className="bg-gray-100 text-gray-600">

// ✅ Certo
<div className="bg-secondary/50 text-muted-foreground">
```

**Tokens mais usados:**
| Token | Uso |
|-------|-----|
| `bg-card` | Fundo de cards/modais |
| `bg-secondary/50` | Fundo de inputs |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Texto secundário |
| `border-border` | Todas as bordas |

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

### Sempre use named exports

```tsx
// ❌ Errado
export default MeuComponente;

// ✅ Certo
export const MeuComponente = () => { ... };
```

### Internacionalização (i18n)

Todos os textos devem ser traduzíveis:

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

const { t } = useLanguage();
<Button>{t('save')}</Button>  // "Salvar" ou "Save"
```

Adicione as chaves em `src/i18n/translations/pt.ts` e `en.ts` (mesma chave, mesma ordem).

### Mensagens de sucesso/erro

```tsx
import { toast } from 'sonner';

toast.success(t('saved'));
toast.error(t('errorSaving'));
```

### Acessibilidade

Botões com apenas ícone precisam de `aria-label`:

```tsx
<Button variant="ghost" size="icon" aria-label={t('edit')}>
  <Pencil className="h-4 w-4" />
</Button>
```

---

## 🧪 Testes e Qualidade

O projeto usa **Vitest**. Arquivos de teste ficam junto do código:

```
src/hooks/
  ├── useBudget.ts       # Código
  └── useBudget.test.ts  # Teste
```

### Comandos

```bash
npm run test:run  # Roda uma vez
npm run test      # Modo watch (re-executa ao salvar)
```

### Como debugar

**Chrome DevTools (F12):**
| Aba | Para quê |
|-----|----------|
| Console | Logs e erros |
| Network | Requisições ao Supabase |
| Application | IndexedDB, Service Worker |

**React DevTools:** Instale a extensão no Chrome para inspecionar componentes, props e state.

### Testar modo offline

1. Chrome DevTools (F12) → aba **Network**
2. Marque **Offline**
3. Use o app — dados ficam no IndexedDB
4. Desmarque Offline — sincroniza com Supabase

---

# Parte 4: Referência

## 🔧 Troubleshooting

### "Port 8080 is already in use"

```bash
# Windows: encontrar e matar o processo
netstat -ano | findstr :8080
taskkill /PID <numero> /F

# Ou use outra porta
npm run dev -- --port 3000
```

### "Supabase connection failed"

- Verifique se `.env.local` existe na raiz
- Confirme se as chaves estão corretas (sem espaços)
- Verifique se o projeto Supabase está ativo

### "Module not found"

```bash
rm -rf node_modules
npm install
```

### Build falha mas dev funciona

- Rode `npm run lint` para ver erros de TypeScript
- Verifique imports não utilizados
- Confirme que não há `any` implícito

---

## 📚 Próximos Passos

1. **Rode o projeto:** `npm run dev`
2. **Explore:** Crie conta, adicione despesas, teste offline
3. **Leia um componente:** Comece por `src/components/goal/GoalCard.tsx`
4. **Faça uma alteração:** Mude uma cor ou texto
5. **Valide:** `npm run lint && npm run test:run && npm run build`
6. **Aprofunde:** Leia o `CONTRIBUTING.md` quando for criar algo novo

### Resumo rápido: onde encontrar cada coisa

| Conceito | Arquivo |
|----------|---------|
| Bundler/dev server | `vite.config.ts` |
| Configuração TS | `tsconfig.json` |
| Estilos | `tailwind.config.ts` |
| Componentes UI | `src/components/ui/` |
| Banco de dados | `src/lib/supabase.ts` |
| Offline | `src/lib/adapters/offlineAdapter.ts` |
| Testes | `vitest.config.ts` |

---

*Boa sorte! Se tiver dúvidas, pergunte. 🚀*
