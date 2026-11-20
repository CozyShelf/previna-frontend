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
| `npm run e2e`           | Ponta a ponta com o navegador local      |
| `npm run e2e:docker`    | Ponta a ponta na imagem do Playwright    |

## CI

`.github/workflows/ci.yml` roda em todo PR e em todo push na `main`: `npm ci`, lint, formatação (Prettier), tipos,
testes com cobertura e build. A cobertura abaixo dos pisos de `test.coverage.thresholds` (`vite.config.ts`) reprova
o PR; suba os pisos quando a cobertura subir. O relatório fica nos artefatos da execução (`cobertura-frontend`).

A CI **não** roda os testes de ponta a ponta (`e2e/`): eles precisam da pilha inteira no ar. Veja a seção abaixo.

## Testes de ponta a ponta (Playwright)

Os testes de `e2e/` usam o [Playwright](https://playwright.dev) (`@playwright/test`) para abrir o portal num
navegador de verdade e passar pelas telas como um usuário: o admin pré-cadastra uma empresa, a empresa faz o
primeiro acesso, cadastra produtos, cupons e promoções e valida códigos, o médico agenda exames, e os painéis da
tela Início mostram o resultado. Seguem o roteiro de ponta a ponta do app
(`previna-frontend-mobile/doc/roteiro-ponta-a-ponta.md`, seções 1, 5, 8 e 9).

| Arquivo                 | O que cobre                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `empresa.spec.ts`       | Pré-cadastro, primeiro acesso (senha do MailHog), produto, cupom, promoção, D12 e D10     |
| `validar-cupom.spec.ts` | Validar cupom pelo menu e pelo tutorial, os resultados da validação e o painel da empresa |
| `medico.spec.ts`        | Linha clicável das gestantes, agendamento, aviso de repetido e o painel do médico         |
| `painel-admin.spec.ts`  | Atividade recente do admin, com a gestante só como "Gestante"                             |
| `perfis.spec.ts`        | Admin em `/produtos` e empresa em `/medicos` voltam para o início                         |
| `saudacao.spec.ts`      | Bom dia, Boa tarde e Boa noite com o relógio do navegador fixado                          |
| `apoio/`                | Endereços (`ambiente.ts`), preparação pela API (`api.ts`) e ações de tela (`tela.ts`)     |

### Pré-requisitos

- O ambiente de dev do [`previna-development`](../previna-development) no ar (`npm run start:dev` lá): portal,
  API, banco e MailHog.
- `npm install` feito aqui.

> **Os testes gravam no banco de dev.** Cada execução cria médicos, empresas, gestantes, produtos, cupons,
> promoções, agendamentos e resgates novos, todos com a marca `E2E <carimbo>` no nome (ex.:
> `Empresa E2E MI8X2K1Q7`). Nada do que já existe é usado nem alterado, além do login do admin do seed
> (`admin`/`admin123`). Para limpar, recrie o banco de dev.

### Como rodar

**Pela imagem oficial do Playwright (recomendado, não instala navegador):**

```bash
npm run e2e:docker
npm run e2e:docker -- e2e/validar-cupom.spec.ts      # um arquivo
npm run e2e:docker -- -g "Boa tarde"                  # testes pelo nome
```

O `e2e/docker.mjs` roda `mcr.microsoft.com/playwright:v<versão do @playwright/test>-noble` na rede
`previna-development_previna-network` (mude com `E2E_DOCKER_NETWORK`), onde o MailHog é `http://mailhog:8025`.
O portal é acessado pelo IP do serviço `nginx` nessa rede, e não por `http://nginx`: o Vite de dev só aceita o
cabeçalho `Host` de `localhost` ou de um IP (`server.allowedHosts`) e responde 403 para `nginx`.

**Com o navegador nesta máquina:**

```bash
npx playwright install chromium     # uma vez
E2E_BASE_URL=http://localhost:8080 npm run e2e
```

### Configuração

| Variável          | Padrão                                      | Uso                                                                 |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `E2E_BASE_URL`    | `http://localhost:<NGINX_PORT>` (padrão 80) | Portal; `NGINX_PORT` vem do `.env` do `previna-development` ao lado |
| `E2E_API_URL`     | `<E2E_BASE_URL>/backend`                    | API, usada para preparar os dados                                   |
| `E2E_MAILHOG_URL` | `http://localhost:8025`                     | MailHog, de onde sai a senha temporária                             |
| `E2E_ADMIN`       | `admin:admin123`                            | Login e senha do administrador do seed                              |
| `E2E_DEV_ENV`     | `../previna-development/.env`               | De onde vem o `NGINX_PORT` (fora dele, porta 80)                    |

### Ver o que aconteceu

- **Modo visual (navegador local):** `npm run e2e -- --ui` abre a interface do Playwright, com a linha do tempo
  de cada passo; `npm run e2e -- --headed` mostra o navegador enquanto os testes rodam.
- **Relatório:** toda execução gera o relatório HTML em `playwright-report/`; abra com
  `npx playwright show-report`.
- **Trace:** quando um teste falha, o trace, o vídeo e a captura de tela ficam em `test-results/` (e no
  relatório). Abra o trace com `npx playwright show-trace test-results/<teste>/trace.zip` ou arrastando o
  arquivo para [trace.playwright.dev](https://trace.playwright.dev). Para gravar o trace de todos os testes,
  passe `--trace on`.

`playwright-report/` e `test-results/` ficam fora do git.

### Como os testes são escritos

- **Dados:** cada arquivo cria pela API, no `beforeAll`, o que precisa (`e2e/apoio/api.ts`, com CPF e CNPJ
  válidos e a senha temporária lida no MailHog), e cria pela tela só o que é o objeto do teste. O médico é
  sempre um novo, sem permissão de ver todas as gestantes, para o painel e a lista mostrarem só o que o teste
  criou.
- **Um teste por vez** (`workers: 1`): a atividade recente do admin mostra as últimas ações do sistema inteiro.
- **Seletores** pelo que o usuário vê: `getByRole`, `getByLabel` e `getByText`, sem `data-testid`.
- **Fuso** `America/Sao_Paulo` no navegador, o mesmo do backend, para "hoje" ser o mesmo dia nos dois.

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
e2e/            testes de ponta a ponta (Playwright), fora do Vitest e da cobertura
```

O alias `@/` aponta para `src/`, ex.: `import { Listagem } from '@/components/sistema/Listagem'`.

Os testes ficam ao lado do código (`*.test.tsx`).

## Variáveis de ambiente

Variáveis expostas ao cliente precisam do prefixo `VITE_`. Veja `.env.example`.

| Variável       | Padrão     | Uso                                                                          |
| -------------- | ---------- | ---------------------------------------------------------------------------- |
| `VITE_API_URL` | `/backend` | URL base da API; no Docker o nginx encaminha `/backend` para a API, sem CORS |
