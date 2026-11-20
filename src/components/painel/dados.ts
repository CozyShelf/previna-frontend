import { formatarData, formatarDataHora } from '@/lib/datas'

// Formato das rotas /painel/* (contrato do painel da tela Início). Todo campo é opcional aqui: um campo que
// não vier, por versão diferente do backend ou erro, deixa aquele pedaço vazio em vez de quebrar a tela.

// Lista curta: total é a contagem completa, itens traz no máximo 5
export interface ListaCurta<T> {
  total?: number
  itens?: T[]
}

export interface AgendamentoDoPainel {
  agendamentoId?: number
  gestanteId?: number
  gestanteNome?: string
  tipoNome?: string
  categoria?: string
  dataPrevista?: string
}

export interface PainelMedicoDados {
  gestantesAcompanhadas?: number
  atrasados?: ListaCurta<AgendamentoDoPainel>
  proximos7Dias?: ListaCurta<AgendamentoDoPainel>
  semAgendamentoPendente?: ListaCurta<{ gestanteId?: number; gestanteNome?: string }>
}

export interface ValidacaoDoPainel {
  resgateId?: number
  codigo?: string
  tipo?: string
  titulo?: string | null
  produtoNome?: string | null
  dataUso?: string
}

export interface PainelEmpresaDados {
  cuponsAtivos?: number
  promocoesVigentes?: number
  resgatesAguardandoUso?: number
  validacoes30Dias?: number
  cuponsVencendo7Dias?: ListaCurta<{
    cupomId?: number
    produtoNome?: string
    dataValidade?: string
  }>
  produtosSemOferta?: ListaCurta<{ produtoId?: number; nome?: string }>
  ultimasValidacoes?: ValidacaoDoPainel[]
}

export interface AtividadeDoPainel {
  dataHora?: string
  acao?: string
  usuarioNome?: string
  perfil?: string
  pontos?: number | null
}

export interface PainelAdminDados {
  medicos?: number
  empresas?: { total?: number; primeiroAcessoPendente?: number }
  gestantes?: { total?: number; primeiroAcessoPendente?: number }
  conteudos?: { publicados?: number; rascunhos?: number }
  empresasPendentes?: ListaCurta<{
    empresaId?: number
    razaoSocial?: string
    preCadastradaEm?: string
  }>
  atividadeRecente?: AtividadeDoPainel[]
}

export interface Lista<T> {
  itens: T[]
  total: number
}

// Lista curta sem buracos: sem itens fica vazia, e o total nunca é menor que o que está na tela
export function lerLista<T>(lista?: ListaCurta<T> | null): Lista<T> {
  const itens = Array.isArray(lista?.itens) ? lista.itens : []
  const total =
    typeof lista?.total === 'number' ? Math.max(lista.total, itens.length) : itens.length
  return { itens, total }
}

// Lista simples (sem total), como as últimas validações
export const lerArray = <T>(lista?: T[] | null): Lista<T> =>
  lerLista({ itens: Array.isArray(lista) ? lista : [] })

export const numero = (valor: unknown) => (typeof valor === 'number' ? valor : undefined)

// Formatadores que aceitam o campo ausente ou inválido: o Intl lança erro com uma data inválida
export const dataOuNada = (data?: string) =>
  data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? formatarData(data) : undefined

export const dataHoraOuNada = (instante?: string) =>
  instante && !Number.isNaN(Date.parse(instante)) ? formatarDataHora(instante) : undefined

// Destino do item: só com um id numérico, para um campo ausente não virar link para ".../undefined"
export const destino = (base: string, id: unknown) =>
  typeof id === 'number' ? `${base}/${id}` : undefined
