import { encerrarSessao, obterToken } from '@/lib/auth'

const API_URL = import.meta.env.VITE_API_URL

// Caminho da API para uso direto pelo navegador, como no src de uma <img>
export const urlDaApi = (caminho: string) => `${API_URL}${caminho}`

// Resposta das listagens paginadas; pagina começa em 0
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
  totalPaginas: number
}

// Códigos que o backend manda no corpo de erro ({ message, codigo }) para distinguir conflitos do mesmo status
export const CODIGOS_DE_ERRO = [
  'PROMOCAO_JA_RESGATADA',
  'PROMOCAO_INDISPONIVEL',
  'PROMOCAO_SOBREPOSTA',
  'CUPOM_INDISPONIVEL',
  'PONTOS_INSUFICIENTES',
  'AGENDAMENTO_PENDENTE_REPETIDO',
] as const

export type CodigoDeErro = (typeof CODIGOS_DE_ERRO)[number]

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo?: CodigoDeErro,
  ) {
    super(`Erro ${status} na requisição`)
  }
}

// Tolerante: corpo vazio, que não é JSON, sem o campo ou com um código desconhecido dá undefined
async function lerCodigo(resposta: Response): Promise<CodigoDeErro | undefined> {
  try {
    const corpo: unknown = JSON.parse(await resposta.text())
    const codigo = (corpo as { codigo?: unknown } | null)?.codigo
    return CODIGOS_DE_ERRO.find((c) => c === codigo)
  } catch {
    return undefined
  }
}

async function requisicao<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = obterToken()
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...init,
    headers: {
      // FormData (upload) leva o próprio Content-Type, com o separador do multipart
      ...(!(init.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  // 401 fora do login é sessão vencida: o token expirado nem chega a ser enviado, então não dá para depender dele
  if (resposta.status === 401 && caminho !== '/auth/login') {
    encerrarSessao()
    window.location.assign('/login')
  }
  if (!resposta.ok) {
    throw new ApiError(resposta.status, await lerCodigo(resposta))
  }
  return resposta.json()
}

export function get<T>(caminho: string) {
  return requisicao<T>(caminho)
}

export function post<T>(caminho: string, corpo: unknown) {
  const body = corpo instanceof FormData ? corpo : JSON.stringify(corpo)
  return requisicao<T>(caminho, { method: 'POST', body })
}

export function put<T>(caminho: string, corpo: unknown) {
  const body = corpo instanceof FormData ? corpo : JSON.stringify(corpo)
  return requisicao<T>(caminho, { method: 'PUT', body })
}

export function del<T>(caminho: string) {
  return requisicao<T>(caminho, { method: 'DELETE' })
}
