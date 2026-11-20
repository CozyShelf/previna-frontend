// Endereços e usuários dos testes de ponta a ponta, todos configuráveis por variável de ambiente:
//   E2E_BASE_URL     portal (padrão http://localhost:<NGINX_PORT do previna-development/.env, ou 80>)
//   E2E_API_URL      API (padrão <E2E_BASE_URL>/backend, o mesmo caminho que o portal usa)
//   E2E_MAILHOG_URL  MailHog, de onde sai a senha temporária da empresa (padrão http://localhost:8025)
//   E2E_DEV_ENV      .env do ambiente de dev (padrão ../previna-development/.env, ao lado deste repositório)
//   E2E_ADMIN        login:senha do administrador do seed (padrão admin:admin123)
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const semBarraNoFim = (url: string) => url.replace(/\/+$/, '')

// NGINX_PORT do ambiente de dev (repositório irmão), se existir: o portal fica em localhost nessa porta
function portaDoNginx() {
  const arquivo =
    process.env.E2E_DEV_ENV ??
    fileURLToPath(new URL('../../../previna-development/.env', import.meta.url))
  if (!existsSync(arquivo)) return '80'
  const linha = readFileSync(arquivo, 'utf8')
    .split('\n')
    .map((texto) => texto.trim())
    .find((texto) => texto.startsWith('NGINX_PORT='))
  return linha?.slice('NGINX_PORT='.length).replace(/^["']|["']$/g, '') || '80'
}

const porta = portaDoNginx()

export const URL_PORTAL = semBarraNoFim(
  process.env.E2E_BASE_URL ?? `http://localhost${porta === '80' ? '' : `:${porta}`}`,
)
export const URL_API = semBarraNoFim(process.env.E2E_API_URL ?? `${URL_PORTAL}/backend`)
export const URL_MAILHOG = semBarraNoFim(process.env.E2E_MAILHOG_URL ?? 'http://localhost:8025')

const [loginAdmin = 'admin', senhaAdmin = 'admin123'] = (
  process.env.E2E_ADMIN ?? 'admin:admin123'
).split(':')
export const ADMIN = { login: loginAdmin, senha: senhaAdmin }

// Senha definitiva de quem os testes criam (médico, empresa e gestante): 8+ caracteres, com letra e número
export const SENHA = 'E2eSenha123'
