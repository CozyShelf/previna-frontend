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
  'RESGATE_NAO_ENCONTRADO',
  'RESGATE_JA_UTILIZADO',
  'RESGATE_EXPIRADO',
] as const

export type CodigoDeErro = (typeof CODIGOS_DE_ERRO)[number]

// Dados extras que alguns erros trazem junto do código, ex.: quando o resgate já foi usado (RESGATE_JA_UTILIZADO)
export interface DetalhesDoErro {
  dataUso?: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo?: CodigoDeErro,
    public detalhes: DetalhesDoErro = {},
  ) {
    super(`Erro ${status} na requisição`)
  }
}

// Tolerante: corpo vazio, que não é JSON, sem o campo ou com um código desconhecido dá código undefined;
// um detalhe que não é texto fica de fora
async function lerErro(resposta: Response): Promise<[CodigoDeErro | undefined, DetalhesDoErro]> {
  try {
    const corpo = JSON.parse(await resposta.text()) as Record<string, unknown> | null
    const codigo = CODIGOS_DE_ERRO.find((c) => c === corpo?.codigo)
    const dataUso = corpo?.dataUso
    return [codigo, typeof dataUso === 'string' ? { dataUso } : {}]
  } catch {
    return [undefined, {}]
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
    throw new ApiError(resposta.status, ...(await lerErro(resposta)))
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
