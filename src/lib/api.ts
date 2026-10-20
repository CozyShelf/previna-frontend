import { encerrarSessao, obterToken } from '@/lib/auth'

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  constructor(public status: number) {
    super(`Erro ${status} na requisição`)
  }
}

async function requisicao<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = obterToken()
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  // 401 fora do login é sessão vencida: o token expirado nem chega a ser enviado, então não dá para depender dele
  if (resposta.status === 401 && caminho !== '/auth/login') {
    encerrarSessao()
    window.location.assign('/login')
  }
  if (!resposta.ok) {
    throw new ApiError(resposta.status)
  }
  return resposta.json()
}

export function get<T>(caminho: string) {
  return requisicao<T>(caminho)
}

export function post<T>(caminho: string, corpo: unknown) {
  return requisicao<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) })
}
