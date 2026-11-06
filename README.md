# previna-frontend

Portal web do **Previna**, sistema que incentiva gestantes de primeira viagem a irem às consultas e aos exames do
pré-natal. É usado pela equipe interna, pelos médicos e pelas empresas parceiras; a gestante usa o app
([`previna-frontend-mobile`](../previna-frontend-mobile)).

## Quem usa e o que faz

| Perfil           | Telas                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Administrador    | Médicos (cadastro e edição) e empresas parceiras (pré-cadastro e situação da conta)             |
| Médico           | Gestantes (pré-cadastro, detalhe, exames e consultas), tipos de exame e consulta, agenda do dia |
| Empresa parceira | Primeiro acesso, tutorial, produtos, promoções, cupons e perfil da empresa                      |

O menu lateral e as rotas protegidas (`RotaProtegida`) mostram a cada perfil só as telas dele.

## Stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [React Router](https://reactrouter.com) para roteamento
- [Tailwind CSS v4](https://tailwindcss.com) para estilos
- [Vitest](https://vitest.dev) + Testing Library para testes
- ESLint + Prettier

## Como rodar

O jeito recomendado é pelo repositório [`previna-development`](../previna-development) (`docker compose up`), que
sobe o portal em `http://localhost` junto com a API. Para rodar só o portal (Node 22):

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

## CI

`.github/workflows/ci.yml` roda em todo PR e em todo push na `main`: `npm ci`, lint, formatação (Prettier), tipos,
testes com cobertura e build. A cobertura abaixo dos pisos de `test.coverage.thresholds` (`vite.config.ts`) reprova
o PR; suba os pisos quando a cobertura subir. O relatório fica nos artefatos da execução (`cobertura-frontend`).

## Estrutura

```
src/
  pages/        telas ligadas às rotas
  components/
    common/     componentes base (botão, campos, formulário, alerta)
    sistema/    estrutura do portal (menu lateral, trilha, menu do perfil, listagem paginada)
    <domínio>/  formulários e cartões de cada área (gestante, médico, produto, cupom...)
  layouts/      layout público e layout do portal logado
  hooks/        usePerfil (perfil logado) e useValidacao (validação de formulários)
  lib/          cliente da API, sessão (token), validações, máscaras e datas
  test/         setup do Vitest e helpers (ex.: entrar como um perfil)
  routes.tsx    definição das rotas
  main.tsx      entrada da aplicação
```

O alias `@/` aponta para `src/`, ex.: `import { Listagem } from '@/components/sistema/Listagem'`.

Os testes ficam ao lado do código (`*.test.tsx`).

## Variáveis de ambiente

Variáveis expostas ao cliente precisam do prefixo `VITE_`. Veja `.env.example`.

| Variável       | Padrão     | Uso                                                                          |
| -------------- | ---------- | ---------------------------------------------------------------------------- |
| `VITE_API_URL` | `/backend` | URL base da API; no Docker o nginx encaminha `/backend` para a API, sem CORS |
