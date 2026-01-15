# Instruções de Segurança para Desenvolvedores

## Regras Obrigatórias

### 1. Credenciais → Variáveis de Ambiente
```typescript
// ❌ const apiKey = 'sk-abc123...';
// ✅ const apiKey = import.meta.env.VITE_API_KEY;
```
- Adicione novas vars ao `.env.example` (sem valores reais) e GitHub Secrets
- NUNCA commite `.env`

### 2. Logging → Logger Estruturado
```typescript
// ❌ console.log('User:', userData);
// ✅ logger.debug('user.load', { userId });
```
ESLint `no-console` ativo — build falha com `console.*`.

### 3. Inputs → Validação Zod
```typescript
// ❌ return supabase.from('users').insert(data);
// ✅ 
const validation = Schema.safeParse(data);
if (!validation.success) return { error: new Error('Invalid input') };
return supabase.from('users').insert(validation.data);
```
- Inputs: `src/lib/validators.ts` | Rows DB: `src/lib/schemas.ts`

### 4. Dados do Cliente → Sempre Desconfie
- RLS do Supabase protege, mas valide formato (IDs, tipos)
- Nunca use `eval()` ou processe input sem sanitização

### 5. HTML Dinâmico → Sanitize ou Evite
```typescript
// ❌ <div dangerouslySetInnerHTML={{ __html: userInput }} />
// ✅ Evite ou sanitize: id.replace(/[^a-zA-Z0-9-_]/g, '')
```

### 6. Tokens na URL → Limpe Imediatamente
```typescript
// PRIMEIRO remove, DEPOIS processa
window.history.replaceState(null, '', window.location.pathname);
const params = new URLSearchParams(hash.slice(1));
```

### 7. localStorage → Use secureStorage
```typescript
// ❌ localStorage.getItem('family-id');
// ✅ getSecureStorageItem('family-id');  // valida antes de retornar
```

## Arquivos de Segurança
| Arquivo | Propósito |
|---------|-----------|
| `src/lib/logger.ts` | Logger estruturado (substitui console) |
| `src/lib/secureStorage.ts` | Acesso validado ao localStorage |
| `src/lib/validators.ts` | Schemas Zod para inputs |
| `src/lib/schemas.ts` | Schemas Zod para rows do banco |

## Checklist PR
- [ ] Sem `console.*` (exceto logger.ts)
- [ ] Sem credenciais hardcoded
- [ ] Inputs validados com Zod
- [ ] `npm run build` e `npm run lint` passam

## Comandos de Verificação
```bash
npm run lint              # Verifica no-console e outros
npm audit                 # Vulnerabilidades em deps
grep -r "eyJ\|sk-" src/   # Possíveis tokens hardcoded
```

## Resumo Rápido
| ❌ Não | ✅ Sim |
|--------|--------|
| `console.log(x)` | `logger.debug('event', x)` |
| `const key = 'abc'` | `import.meta.env.VITE_KEY` |
| `.insert(req.body)` | `.insert(validatedData)` |
| `localStorage.get(x)` | `getSecureStorageItem(x)` |

---
*Se parece inseguro, provavelmente é. Pergunte no PR.*
