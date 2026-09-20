# previna-frontend

System to encourage first-time mothers to attend prenatal consultations.

## Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [React Router](https://reactrouter.com) para roteamento
- [Tailwind CSS v4](https://tailwindcss.com) para estilos
- [Vitest](https://vitest.dev) + Testing Library para testes
- ESLint + Prettier

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Script                  | Descrição                                |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento (porta 5173) |
| `npm run build`         | Typecheck + build de produção em `dist/` |
| `npm run preview`       | Serve o build de produção localmente     |
| `npm run typecheck`     | Checagem de tipos                        |
| `npm run lint`          | ESLint (`lint:fix` para corrigir)        |
| `npm run format`        | Prettier (`format:check` só verifica)    |
| `npm test`              | Testes uma vez (`test:watch` em watch)   |
| `npm run test:coverage` | Testes com relatório de cobertura        |

## Estrutura

```
src/
  components/   componentes compartilhados (AppLayout)
  pages/        telas ligadas às rotas
  lib/          helpers e integrações (ex.: cliente HTTP)
  test/         setup do Vitest
  routes.tsx    definição das rotas
  main.tsx      entrada da aplicação
```

O alias `@/` aponta para `src/`, ex.: `import { HomePage } from '@/pages/HomePage'`.

## Variáveis de ambiente

Variáveis expostas ao cliente precisam do prefixo `VITE_`. Veja `.env.example`.
