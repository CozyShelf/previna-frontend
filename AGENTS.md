# AGENTS.md — previna-frontend

Guia para agentes de IA (Codex, opencode, Cursor, Gemini, Claude Code). Curto de propósito: os detalhes estão no
`README.md` e em `doc/`; leia sob demanda pelo índice no fim.

## O que é

Portal web do Previna, usado pelo administrador, pelos médicos e pelas empresas parceiras (a gestante usa o app,
`previna-frontend-mobile`). A API é o `previna-backend`. Perfis e telas: tabela "Quem usa e o que faz" do `README.md`.

## Stack

Vite + React 19 + TypeScript, React Router, Tailwind CSS v4, Vitest + Testing Library (jsdom), Playwright (E2E),
ESLint + Prettier. Node 22.

## Comandos

```bash
npm install && cp .env.example .env   # primeira vez (VITE_API_URL=/backend)
npm run dev                           # porta 5173; pilha completa: npm run start:dev no previna-development
npm run lint                          # lint:fix corrige
npm run format:check                  # format escreve
npm run typecheck
npm test                              # test:watch em watch
npm run test:coverage                 # testes + pisos de cobertura
npm run build
npm run e2e:docker                    # E2E na imagem do Playwright; exige a pilha de dev no ar
```

## Regras obrigatórias

- Código, textos e commits em português. Alias `@/` → `src/`.
- Toda chamada HTTP passa por `src/lib/api.ts`. Variável exposta ao cliente precisa do prefixo `VITE_`.
- Erros da API: decida pelo `codigo` (`CODIGOS_DE_ERRO` em `api.ts`), nunca pelo texto de `message`.
- Formulários usam `Form`, `SecaoFormulario`, `InputGroup`/`SelectGroup` (`components/common`) e `useValidacao`;
  botão de envio com `useEnvioUnico` contra clique duplo (a proteção de verdade é do backend).
- Rotas em `src/routes.tsx`; telas por perfil ficam atrás de `RotaProtegida`, e o menu mostra só as do perfil.
- Testes ao lado do código (`*.test.tsx`); helpers em `src/test/`. E2E em `e2e/`, fora do Vitest e da cobertura.
- E2E: seletores pelo que o usuário vê (`getByRole`, `getByLabel`, `getByText`), sem `data-testid`; dados criados
  pela API no `beforeAll`, marcados `E2E <carimbo>`; `workers: 1`; fuso `America/Sao_Paulo`.
- **Os E2E gravam no banco de dev.** Nunca aponte-os para outro ambiente.
- Cobertura subiu: suba os pisos de `test.coverage.thresholds` em `vite.config.ts`.
- Branches de trabalho partem da `development` e voltam por PR, no padrão Conventional Commits.

## Definição de pronto

O que `.github/workflows/ci.yml` roda, todos verdes:

```bash
npm ci && npm run lint && npm run format:check && npm run typecheck && npm run test:coverage && npm run build
```

A CI não roda os E2E: quando a mudança toca uma tela coberta por `e2e/`, rode `npm run e2e:docker` com a pilha de
dev no ar. Mudou tela, script ou variável: atualize o `README.md`.

## Memória do projeto

- **Decisões** que ainda não viraram código (ou cujo porquê não cabe no código) vão para `doc/decisoes/`, um
  arquivo por decisão, `AAAA-MM-DD-assunto.md`, no modelo de `doc/decisoes/README.md`.
- **Troca de agente:** antes de parar no meio de uma tarefa, escreva `HANDOFF.md` na raiz com estado, decisões
  tomadas, próximos passos e dúvidas abertas. O próximo agente o lê antes de começar e o atualiza ou apaga ao
  terminar. O arquivo está no `.gitignore`: é passagem de bastão, não documentação.
- Conhecimento durável (comandos, armadilhas, regras) vai para este arquivo ou para `doc/`, versionado, e não
  só na memória privada de uma ferramenta.

## Índice

| Caminho                                                   | Conteúdo                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `README.md`                                               | Perfis, scripts, CI, E2E (pré-requisitos, variáveis, como depurar), estrutura e variáveis de ambiente |
| `e2e/apoio/`                                              | Endereços, preparação pela API e ações de tela dos E2E                                                |
| `doc/decisoes/`                                           | Registro de decisões (modelo no README da pasta)                                                      |
| `../previna-backend/docs/README.md`                       | Regras de negócio da API e tabela de códigos de erro                                                  |
| `../previna-frontend-mobile/doc/roteiro-ponta-a-ponta.md` | Roteiro de ponta a ponta que os E2E seguem                                                            |
