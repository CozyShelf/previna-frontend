#!/usr/bin/env node
// npm run e2e:docker: roda os testes de ponta a ponta na imagem oficial do Playwright, dentro da rede Docker do
// ambiente de dev (previna-development). Não precisa instalar navegador nesta máquina. Os argumentos extras vão
// para o "playwright test", ex.: npm run e2e:docker -- e2e/saudacao.spec.ts
//
// Variáveis (todas opcionais):
//   E2E_DOCKER_NETWORK  rede do compose (padrão previna-development_previna-network)
//   E2E_BASE_URL        portal visto do container (padrão: o IP do serviço nginx nessa rede, ver abaixo)
//   E2E_MAILHOG_URL     MailHog visto do container (padrão http://mailhog:8025)
//   E2E_API_URL, E2E_ADMIN  repassadas como estão
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))

// A imagem tem de ser da mesma versão do @playwright/test instalado, senão os navegadores dela não servem
const { version } = JSON.parse(
  readFileSync(new URL('../node_modules/@playwright/test/package.json', import.meta.url), 'utf8'),
)
const imagem = `mcr.microsoft.com/playwright:v${version}-noble`
const rede = process.env.E2E_DOCKER_NETWORK ?? 'previna-development_previna-network'

const ambiente = {
  E2E_MAILHOG_URL: process.env.E2E_MAILHOG_URL ?? 'http://mailhog:8025',
  E2E_BASE_URL: process.env.E2E_BASE_URL,
  E2E_API_URL: process.env.E2E_API_URL,
  E2E_ADMIN: process.env.E2E_ADMIN,
  CI: process.env.CI,
  // A imagem roda com o usuário desta máquina (abaixo), que não tem home lá dentro
  HOME: '/tmp',
  NPM_CONFIG_UPDATE_NOTIFIER: 'false',
}

const argumentos = ['run', '--rm', '--init', '--ipc=host', '--network', rede]
argumentos.push('-v', `${raiz}:/app`, '-w', '/app')
// Os relatórios saem com o dono certo, e não como root
if (process.getuid) argumentos.push('--user', `${process.getuid()}:${process.getgid()}`)
if (process.stdout.isTTY) argumentos.push('-t')
for (const [chave, valor] of Object.entries(ambiente)) {
  if (valor !== undefined) argumentos.push('-e', `${chave}=${valor}`)
}

// O portal de dev é o Vite, que só aceita o cabeçalho Host de localhost ou de um IP (server.allowedHosts):
// http://nginx levaria 403 "Blocked request". Por isso o padrão é o IP do nginx na rede, resolvido lá dentro.
const script =
  'if [ -z "$E2E_BASE_URL" ]; then ' +
  'ip=$(getent hosts nginx | cut -d" " -f1); ' +
  'if [ -z "$ip" ]; then echo "[e2e:docker] O serviço nginx não está na rede."; exit 1; fi; ' +
  'export E2E_BASE_URL="http://$ip"; fi; ' +
  'exec npx playwright test "$@"'
argumentos.push(imagem, 'sh', '-c', script, 'playwright', ...process.argv.slice(2))

console.log(`[e2e:docker] ${imagem} na rede ${rede}`)
const { status, error } = spawnSync('docker', argumentos, { stdio: 'inherit' })
if (error) {
  console.error(`[e2e:docker] Não consegui rodar o docker: ${error.message}`)
  process.exit(1)
}
process.exit(status ?? 1)
