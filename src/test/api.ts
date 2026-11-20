import { vi } from 'vitest'

export interface RespostaSimulada {
  status?: number
  corpo: unknown
}

// fetch simulado pelo fim do caminho (ex.: '/painel/medico'). Cada caminho tem uma fila de respostas; a última
// se repete. Um caminho fora do mapa responde 404, para o teste falhar se a tela chamar o que não devia
export function simularApi(mapa: Record<string, RespostaSimulada[]>) {
  const filas = new Map(Object.entries(mapa).map(([caminho, fila]) => [caminho, [...fila]]))
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const caminho = [...filas.keys()].find((c) => String(url).endsWith(c))
    const fila = caminho ? filas.get(caminho)! : []
    const resposta = fila.length > 1 ? fila.shift()! : fila[0]
    if (!resposta) return new Response('', { status: 404 })
    return new Response(JSON.stringify(resposta.corpo), { status: resposta.status ?? 200 })
  })
}

// Caminhos chamados, na ordem, sem o endereço da API (o api.ts monta `${VITE_API_URL}${caminho}`)
const PREFIXO = `${import.meta.env.VITE_API_URL}`
export const caminhosChamados = (fetch: ReturnType<typeof simularApi>) =>
  fetch.mock.calls.map(([url]) => String(url).slice(PREFIXO.length))
