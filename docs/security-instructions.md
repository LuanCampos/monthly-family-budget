# Instruções de Segurança para Desenvolvedores

Este documento define as práticas obrigatórias de segurança que todo desenvolvedor deve seguir ao contribuir com este projeto.

---

## 🚨 Regras de Ouro

### 1. NUNCA Hardcode Credenciais

```typescript
// ❌ ERRADO - NUNCA faça isso
const apiKey = 'sk-abc123...';
const supabaseUrl = 'https://xxx.supabase.co';

// ✅ CORRETO - Use variáveis de ambiente
const apiKey = import.meta.env.VITE_API_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

**Checklist:**
- [ ] Toda credencial, URL de API ou token deve vir de `import.meta.env`
- [ ] Adicione novas variáveis ao `.env.example` (sem valores reais)
- [ ] Adicione novas variáveis aos GitHub Secrets para deploy
- [ ] NUNCA commite arquivos `.env`

---

### 2. NUNCA Use console.log/error/warn

```typescript
// ❌ ERRADO - Vaza informações em produção
console.log('User data:', userData);
console.error('Failed:', error);

// ✅ CORRETO - Use o logger estruturado
import { logger } from '@/lib/logger';

logger.debug('user.load.start', { userId });  // Só aparece em dev
logger.info('user.load.success', { userId });
logger.warn('user.load.partial', { missing: 'email' });
logger.error('user.load.failed', { error });
```

**Regra ESLint:** A regra `no-console` está ativa. O build falhará se você usar `console.*`.

---

### 3. SEMPRE Valide Inputs Antes de Operações de Banco

```typescript
// ❌ ERRADO - Sem validação
export const insertUser = async (data: any) => {
  return supabase.from('users').insert(data);
};

// ✅ CORRETO - Com validação Zod
import { CreateUserInputSchema } from '../validators';
import { logger } from '../logger';

export const insertUser = async (data: unknown) => {
  const validation = CreateUserInputSchema.safeParse(data);
  if (!validation.success) {
    logger.warn('user.insert.validationFailed', { error: validation.error.message });
    return { data: null, error: new Error('Invalid input') };
  }
  return supabase.from('users').insert(validation.data);
};
```

**Onde criar schemas:**
- Input de usuário: `src/lib/validators.ts`
- Rows do banco: `src/lib/schemas.ts`

---

### 4. NUNCA Confie em Dados do Cliente

```typescript
// ❌ ERRADO - ID vem do cliente sem verificação
const deleteExpense = async (id: string) => {
  await supabase.from('expense').delete().eq('id', id);
};

// ✅ CORRETO - RLS do Supabase protege, mas sempre valide formato
const deleteExpense = async (id: string) => {
  if (!id || typeof id !== 'string' || id.length < 10) {
    return { error: new Error('Invalid ID') };
  }
  // RLS garante que o usuário só deleta seus próprios dados
  return supabase.from('expense').delete().eq('id', id);
};
```

---

### 5. SEMPRE Sanitize Dados Antes de Renderizar HTML Dinâmico

```typescript
// ❌ ERRADO - Vulnerável a XSS/CSS injection
<style dangerouslySetInnerHTML={{ __html: `[data-id=${id}] { color: ${color} }` }} />

// ✅ CORRETO - Sanitize primeiro
const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '');
const safeColor = /^(#[0-9a-fA-F]{3,8}|[a-z]+)$/.test(color) ? color : 'inherit';
<style dangerouslySetInnerHTML={{ __html: `[data-id=${safeId}] { color: ${safeColor} }` }} />
```

**Prefira:** Evite `dangerouslySetInnerHTML` sempre que possível. Use CSS modules ou styled-components.

---

### 6. SEMPRE Limpe Dados Sensíveis da URL Imediatamente

```typescript
// ❌ ERRADO - Token fica exposto no histórico
useEffect(() => {
  const hash = window.location.hash;
  // ... processa token
  // Limpa depois
  window.history.replaceState(null, '', pathname);
}, []);

// ✅ CORRETO - Limpa ANTES de processar
useEffect(() => {
  const hash = window.location.hash;
  if (!hash) return;
  
  // PRIMEIRO: Remove da URL
  window.history.replaceState(null, '', window.location.pathname);
  
  // DEPOIS: Processa
  const params = new URLSearchParams(hash.slice(1));
  // ...
}, []);
```

---

### 7. SEMPRE Use Funções de Storage Seguro

```typescript
// ❌ ERRADO - Sem validação
const familyId = localStorage.getItem('current-family-id');

// ✅ CORRETO - Use a utilidade segura
import { getSecureStorageItem } from '@/lib/secureStorage';

const familyId = getSecureStorageItem('current-family-id');
// Retorna null se o valor for inválido/malicioso
```

**Quando adicionar nova chave:**
1. Adicione o pattern de validação em `src/lib/secureStorage.ts`
2. Use `getSecureStorageItem` e `setSecureStorageItem`

---

## 📁 Estrutura de Arquivos de Segurança

```
src/lib/
├── logger.ts          # Logger estruturado (use em vez de console)
├── secureStorage.ts   # Acesso seguro ao localStorage
├── validators.ts      # Schemas Zod para inputs
├── schemas.ts         # Schemas Zod para rows do banco
└── supabase.ts        # Cliente Supabase (usa env vars)
```

---

## ✅ Checklist Antes de Cada PR

### Obrigatório
- [ ] Não há `console.log/error/warn` no código (exceto logger.ts)
- [ ] Não há credenciais/URLs hardcoded
- [ ] Inputs de usuário são validados com Zod antes de ir ao banco
- [ ] Dados sensíveis (tokens) são limpos da URL imediatamente
- [ ] Build passa sem erros: `npm run build`
- [ ] Lint passa: `npm run lint`
- [ ] TypeScript passa: `npx tsc --noEmit`

### Recomendado
- [ ] `npm audit` não mostra vulnerabilidades críticas
- [ ] Novos campos de localStorage usam `secureStorage.ts`
- [ ] Funções que recebem dados externos têm validação

---

## 🔧 Comandos Úteis

```bash
# Verificar se há console.* no código
npm run lint | grep "no-console"

# Verificar vulnerabilidades em dependências
npm audit

# Build completo (falha se houver erros)
npm run build

# Verificar tipos
npx tsc --noEmit

# Procurar por possíveis credenciais hardcoded
grep -r "eyJ" src/           # JWT tokens
grep -r "sk-" src/           # API keys
grep -r "supabase.co" src/   # URLs (deve estar só em env)
```

---

## 🚫 O Que NUNCA Fazer

| ❌ Não Faça | ✅ Faça Isso |
|------------|-------------|
| `console.log(data)` | `logger.debug('event', data)` |
| `const key = 'abc123'` | `const key = import.meta.env.VITE_KEY` |
| `eval(userInput)` | Valide e processe manualmente |
| `.insert(req.body)` | `.insert(validatedData)` |
| `innerHTML = userInput` | Use React JSX ou sanitize |
| `localStorage.getItem(x)` | `getSecureStorageItem(x)` |

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)
- [Zod Documentation](https://zod.dev/)

---

## 🆘 Dúvidas?

Se não tiver certeza se algo é seguro:
1. **Pergunte** no PR - melhor prevenir
2. Siga o princípio: **"Se parece inseguro, provavelmente é"**

---

*Lembre-se: Segurança não é uma feature, é um requisito fundamental.*
