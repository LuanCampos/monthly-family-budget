# Monthly Family Budget

![Release](https://img.shields.io/badge/release-v1.0-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Demo](https://img.shields.io/badge/demo-gh-pages-purple)

A cloud-first, multi-user family budget manager built with Vite, React and TypeScript. It supports online collaboration via Supabase and works offline with local persistence and background sync.

Live demo: https://luancampos.github.io/monthly-family-budget/

Other languages: Português — see README.pt-BR.md

Key features

- Cloud-first collaboration with Supabase for shared family workspaces
- Offline-capable with local persistence and a sync queue
- Built with React, TypeScript, Vite, Tailwind CSS and shadcn-ui primitives
- Income input, expense entries, recurring expenses, categories/subcategories, charts, monthly summaries, family invites and role-based membership

Quick start (development)

Clone and run locally:

```bash
git clone https://github.com/luancampos/monthly-family-budget.git
cd monthly-family-budget
npm install
npm run dev
```

Open the app at `http://localhost:8080` (or the URL Vite prints).

Recommended commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

Contributing

- Open an issue to propose changes or report bugs
- Create a branch for your change: `git checkout -b feat/your-feature`
- Keep changes focused and add tests or verifications when appropriate
- Use existing `src/components/ui/*` primitives for new UI elements to keep consistency

License

- This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

