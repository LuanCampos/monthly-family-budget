## README (Português / pt-BR)

![Release](https://img.shields.io/badge/release-v1.0-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Demo](https://img.shields.io/badge/demo-gh-pages-purple)

Aplicativo de orçamento familiar, cloud-first e multiusuário, construído com Vite, React e TypeScript. Suporta colaboração online via Supabase e funciona off-line com persistência local e sincronização em segundo plano.

Demo: https://luancampos.github.io/monthly-family-budget/

Outros idiomas: English — veja README.md

Principais funcionalidades

- Colaboração cloud-first com Supabase para espaços familiares compartilhados
- Suporte off-line com persistência local e fila de sincronização
- Construído com React, TypeScript, Vite, Tailwind CSS e primitives shadcn-ui
- Entrada de renda, lançamento de despesas, despesas recorrentes, categorias/subcategorias, gráficos, resumos mensais, convites de família e papéis/permissões

Como rodar (desenvolvimento)

```bash
git clone https://github.com/luancampos/monthly-family-budget.git
cd monthly-family-budget
npm install
npm run dev
```

O app ficará disponível em `http://localhost:8080` (ou na URL que o Vite exibir).

Comandos recomendados

- Instalar dependências: `npm install`
- Iniciar servidor dev: `npm run dev`
- Build para produção: `npm run build`
- Visualizar build de produção: `npm run preview`

Contribuindo

- Abra uma issue para propor mudanças ou reportar bugs
- Crie uma branch para sua alteração: `git checkout -b feat/sua-mudanca`
- Mantenha mudanças focadas e adicione testes/verificações quando apropriado
- Use os componentes em `src/components/ui/*` para novos elementos de UI

Licença

- Este projeto está licenciado sob a Licença MIT — veja o arquivo [LICENSE](LICENSE) para detalhes.

