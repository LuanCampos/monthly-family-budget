# GitHub Copilot Instructions — Monthly Family Budget

> **🚨 OBRIGATÓRIO: Leia [`CONTRIBUTING.md`](../CONTRIBUTING.md) ANTES de qualquer alteração.**

## Stack
Vite + React 18 + TypeScript + Supabase + IndexedDB — Cloud-first, offline-capable.

## Fluxo de Dados
```
Component → Hook → storageAdapter → Service (Supabase) | offlineAdapter (IndexedDB)
```

## Diretórios Principais
| Camada | Path |
|--------|------|
| Services | `src/lib/services/` |
| Adapters | `src/lib/adapters/` |
| Hooks | `src/hooks/` |
| Components | `src/components/{domain}/` |
| Types | `src/types/` |

## Sufixos de Componentes (Ver CONTRIBUTING.md para lista completa)
| Sufixo | Uso |
|--------|-----|
| `*FormFields` | Campos de form (sem Dialog) |
| `*FormDialog` | Dialog criar/editar UMA entidade |
| `*ListDialog` | Dialog com lista + CRUD (abre FormDialog) |
| `*Panel` | Componente autônomo complexo |
| `*Card` | Exibição de entidade |

**❌ Proibidos**: `*Manager`, `*Container`, `*Modal`, `*Form` (para dialogs)

## Regras Críticas

### Dialogs
```tsx
<DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
```
- Header: `px-6 pt-6 pb-4 border-b border-border`
- Content: `px-6 py-4 overflow-y-auto`
- Footer: `px-6 py-4 border-t border-border bg-secondary/30` (NÃO use DialogFooter)

### Inputs
```tsx
<Input className="h-10 bg-secondary/50 border-border" />
```

### Cores (NUNCA hardcode)
| Uso | Token |
|-----|-------|
| Fundo cards | `bg-card` |
| Fundo inputs | `bg-secondary/50` |
| Texto | `text-foreground` / `text-muted-foreground` |
| Bordas | `border-border` |

### Segurança
- `logger.*` em vez de `console.*`
- `import.meta.env.*` para credenciais
- `secureStorage` em vez de `localStorage`

### Offline
```tsx
if (offlineAdapter.isOfflineId(familyId) || !navigator.onLine) {
  // IndexedDB
} else {
  // Supabase
}
```

## Comandos
```bash
npm run dev && npm run build && npm run lint
```

## ⛔ Não Faça
- Chamar Supabase de componentes
- `export default`
- Múltiplos componentes por arquivo
- `any` (use `unknown`)
- Cores hardcoded
- `DialogFooter`

---

*Documentação completa em CONTRIBUTING.md*
