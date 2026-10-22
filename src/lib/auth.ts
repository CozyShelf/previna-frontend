const CHAVE_TOKEN = 'previna.token'

interface PayloadToken {
  perfil: string
  exp: number
}

function decodificar(token: string): PayloadToken {
  const payload = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(payload))
}

export function perfilDoToken(token: string) {
  return decodificar(token).perfil
}

export function salvarToken(token: string) {
  localStorage.setItem(CHAVE_TOKEN, token)
}

export function encerrarSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
}

function expirado(token: string) {
  try {
    return decodificar(token).exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function obterToken() {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (token && !expirado(token)) {
    return token
  }
  encerrarSessao()
  return null
}
