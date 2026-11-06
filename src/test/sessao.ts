import { salvarToken } from '@/lib/auth'

// Token no formato do backend (só o payload importa para o front), válido por mais 1 minuto
export function tokenDe(perfil: string, primeiroAcesso = false) {
  const payload = { perfil, primeiroAcesso, exp: Date.now() / 1000 + 60 }
  return `cabecalho.${btoa(JSON.stringify(payload))}.assinatura`
}

// Abre a sessão como o perfil dado, como se o login tivesse acabado de acontecer
export function entrarComo(perfil: string, primeiroAcesso = false) {
  salvarToken(tokenDe(perfil, primeiroAcesso))
}
