// Preparação dos dados pela API, para os testes não dependerem do que já existe no banco de dev. Tudo o que é
// criado leva a marca "E2E <carimbo>" no nome. Adaptado de previna-frontend-mobile/e2e/preparar.mjs.
import { Buffer } from 'node:buffer'

import { ADMIN, SENHA, URL_API, URL_MAILHOG } from './ambiente'

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly corpo: string,
  ) {
    super(mensagem)
  }
}

interface OpcoesApi {
  token?: string
  json?: unknown
  // Multipart, como o primeiro acesso e o cadastro de produto esperam
  form?: Record<string, string | number | boolean>
}

export async function api<T>(
  metodo: string,
  caminho: string,
  { token, json, form }: OpcoesApi = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: string | FormData | undefined
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = new FormData()
    for (const [chave, valor] of Object.entries(form)) body.append(chave, String(valor))
  }
  let resposta: Response
  try {
    resposta = await fetch(`${URL_API}${caminho}`, { method: metodo, headers, body })
  } catch (e) {
    throw new Error(
      `Sem resposta de ${URL_API}${caminho}. O ambiente de dev (previna-development) está no ar?`,
      { cause: e },
    )
  }
  const texto = await resposta.text()
  if (!resposta.ok) {
    throw new ErroApi(`${metodo} ${caminho} → ${resposta.status}: ${texto}`, resposta.status, texto)
  }
  return (texto ? JSON.parse(texto) : undefined) as T
}

interface Sessao {
  token: string
  primeiroAcesso: boolean
  tutorialPendente: boolean
}

export const entrar = (login: string, senha: string) =>
  api<Sessao>('POST', '/auth/login', { json: { login, senha } })

export const tokenDoAdmin = async () => (await entrar(ADMIN.login, ADMIN.senha)).token

// "E2E <carimbo>": o carimbo é o instante em base 36 mais dois caracteres sorteados, único entre os testes
export function novaMarca() {
  const sorteio = Math.floor(Math.random() * 36 ** 2)
    .toString(36)
    .padStart(2, '0')
  return `E2E ${Date.now().toString(36)}${sorteio}`.toUpperCase()
}

// Parte da marca que serve em login e e-mail: "e2e.xxx"
export const sufixo = (marca: string) => marca.replace(/^E2E /, '').toLowerCase()

// Data (aaaa-mm-dd) no fuso do backend, que roda em America/Sao_Paulo e usa LocalDate.now()
export function hoje(diasDepois = 0) {
  const data = new Date(Date.now() + diasDepois * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(data)
}

// aaaa-mm-dd -> dd/mm/aaaa, como o portal mostra
export const formatarData = (data: string) => data.split('-').reverse().join('/')

// Dígitos verificadores pelo módulo 11, com os pesos de cada documento
function digito(numeros: number[], pesos: number[]) {
  const soma = numeros.reduce((total, n, i) => total + n * (pesos[i] ?? 0), 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

function aleatorios(quantidade: number) {
  // Primeiro dígito diferente do segundo: nunca sai "todos iguais", que os validadores recusam
  const numeros = Array.from({ length: quantidade }, () => Math.floor(Math.random() * 10))
  numeros[0] = ((numeros[1] ?? 0) + 1) % 10
  return numeros
}

export function gerarCpf() {
  const base = aleatorios(9)
  const d1 = digito(base, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digito([...base, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...base, d1, d2].join('')
}

export function gerarCnpj() {
  const base = [...aleatorios(8), 0, 0, 0, 1]
  const d1 = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digito([...base, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...base, d1, d2].join('')
}

// Sorteia outro documento se o sorteado já estiver cadastrado (409)
async function comDocumentoUnico<T>(tentar: () => Promise<T>) {
  let ultimo: unknown
  for (let i = 0; i < 5; i++) {
    try {
      return await tentar()
    } catch (e) {
      if (!(e instanceof ErroApi) || e.status !== 409) throw e
      ultimo = e
    }
  }
  throw new Error('Não consegui um CPF/CNPJ livre em 5 tentativas.', { cause: ultimo })
}

// --- MailHog ---------------------------------------------------------------------------------------------------

interface MensagemMailhog {
  Content?: { Body?: string; Headers?: Record<string, string[] | undefined> }
}

// O MailHog guarda o corpo como chegou: normalmente em quoted-printable, por causa dos acentos
function decodificarCorpo(mensagem: MensagemMailhog) {
  const corpo = mensagem.Content?.Body ?? ''
  const codificacao = mensagem.Content?.Headers?.['Content-Transfer-Encoding']?.[0]?.toLowerCase()
  if (codificacao === 'base64') return Buffer.from(corpo, 'base64').toString('utf8')
  if (codificacao === 'quoted-printable') {
    const bytes = corpo
      .replace(/=\r?\n/g, '')
      .replace(/=([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    return Buffer.from(bytes, 'latin1').toString('utf8')
  }
  return corpo
}

// Senha temporária do e-mail de pré-cadastro, enviado ao MailHog do ambiente de dev
export async function senhaTemporariaPorEmail(email: string) {
  const url = `${URL_MAILHOG}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    let dados: { items?: MensagemMailhog[] }
    try {
      dados = (await (await fetch(url)).json()) as typeof dados
    } catch (e) {
      throw new Error(`Sem resposta do MailHog em ${URL_MAILHOG}.`, { cause: e })
    }
    for (const mensagem of dados.items ?? []) {
      const senha = decodificarCorpo(mensagem).match(/Senha tempor[aá]ria:\s*(\S+)/)?.[1]
      if (senha) return senha
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`O e-mail com a senha temporária de ${email} não chegou ao MailHog.`)
}

// --- Contas ----------------------------------------------------------------------------------------------------

export interface Conta {
  id?: number
  nome: string
  login: string
  senha: string
  token: string
}

// Médico novo, sem permissão de ver todas as gestantes: o painel e a lista dele só têm o que o teste criou
export async function criarMedico(marca: string): Promise<Conta> {
  const admin = await tokenDoAdmin()
  const nome = `Médico ${marca}`
  const login = `e2e.m.${sufixo(marca)}`
  const medico = await comDocumentoUnico(() =>
    api<{ id: number }>('POST', '/medicos', {
      token: admin,
      json: {
        nome,
        cpf: gerarCpf(),
        email: `${login}@previna.test`,
        crm: `CRM${sufixo(marca)}`.slice(0, 20),
        login,
        senha: SENHA,
        verTodasGestantes: false,
      },
    }),
  )
  const { token } = await entrar(login, SENHA)
  return { id: medico.id, nome, login, senha: SENHA, token }
}

export interface EmpresaPreCadastrada {
  nome: string
  cnpj: string
  email: string
}

export async function preCadastrarEmpresa(marca: string): Promise<EmpresaPreCadastrada> {
  const admin = await tokenDoAdmin()
  const nome = `Empresa ${marca}`
  const email = `e2e.e.${sufixo(marca)}@previna.test`
  const { cnpj } = await comDocumentoUnico(() =>
    api<{ cnpj: string }>('POST', '/empresas/pre-cadastro', {
      token: admin,
      json: {
        razaoSocial: nome,
        cnpj: gerarCnpj(),
        email,
        telefone: '1133334444',
        responsavel: `Responsável ${marca}`,
      },
    }),
  )
  return { nome, cnpj, email }
}

// Empresa pronta para usar: pré-cadastro pelo admin, senha temporária do MailHog e primeiro acesso
export async function criarEmpresa(marca: string): Promise<Conta> {
  const { nome, cnpj, email } = await preCadastrarEmpresa(marca)
  // O login temporário da empresa é o CNPJ; a senha só vai por e-mail
  const temporaria = await entrar(cnpj, await senhaTemporariaPorEmail(email))
  const login = `e2e.e.${sufixo(marca)}`
  await api('PUT', '/empresas/primeiro-acesso', {
    token: temporaria.token,
    form: {
      novoLogin: login,
      novaSenha: SENHA,
      endereco: 'Rua dos Testes, 100',
      segmento: 'Farmácia',
    },
  })
  const { token } = await entrar(login, SENHA)
  return { nome, login, senha: SENHA, token }
}

export interface Gestante {
  id: number
  nome: string
  // Login e senha temporários (o CPF e a senha gerada)
  temporarias: { login: string; senha: string }
}

// Pré-cadastro pelo médico, que passa a acompanhá-la
export async function criarGestante(medico: Conta, nome: string): Promise<Gestante> {
  const temporarias = await comDocumentoUnico(() =>
    api<{ login: string; senha: string }>('POST', '/gestantes/pre-cadastro', {
      token: medico.token,
      json: {
        nome,
        cpf: gerarCpf(),
        dataNascimento: '1995-03-10',
        telefone: '11987654321',
        dum: hoje(-84),
      },
    }),
  )
  // O id não volta no pré-cadastro: procura pelo nome, que é único por causa da marca
  const busca = await api<{ itens: { id: number; nome: string }[] }>(
    'GET',
    `/gestantes?busca=${encodeURIComponent(nome)}&somenteMinhas=true`,
    { token: medico.token },
  )
  const gestante = busca.itens.find((g) => g.nome === nome)
  if (!gestante) throw new Error(`A gestante "${nome}" não apareceu na lista do médico.`)
  return { id: gestante.id, nome, temporarias }
}

// Primeiro acesso e tutorial da gestante (o que ela faria no app), para ela poder resgatar
export async function ativarGestante(gestante: Gestante, marca: string): Promise<Conta> {
  const login = `e2e.g.${sufixo(marca)}.${gestante.id}`
  const temporaria = await entrar(gestante.temporarias.login, gestante.temporarias.senha)
  await api('PUT', '/gestantes/primeiro-acesso', {
    token: temporaria.token,
    form: { novoLogin: login, novaSenha: SENHA, consentimentoLgpd: true },
  })
  const sessao = await entrar(login, SENHA)
  if (sessao.tutorialPendente) {
    await api('PUT', '/gestantes/tutorial-concluido', { token: sessao.token })
  }
  return { id: gestante.id, nome: gestante.nome, login, senha: SENHA, token: sessao.token }
}

export interface TipoAtendimento {
  id: number
  nome: string
  categoria: string
  padrao: boolean
}

// Um exame padrão do sistema, igual para qualquer médico
export async function exameAgendavel(medico: Conta) {
  const tipos = await api<TipoAtendimento[]>('GET', '/tipos-atendimento?categoria=EXAME', {
    token: medico.token,
  })
  const exame =
    tipos.find((t) => t.padrao && t.nome === 'Hemograma completo') ??
    tipos.find((t) => t.padrao) ??
    tipos[0]
  if (!exame) throw new Error('Nenhum tipo de exame cadastrado para o médico.')
  return exame
}

export async function agendar(medico: Conta, gestanteId: number, data: string, marca: string) {
  const exame = await exameAgendavel(medico)
  const [agendamento] = await api<{ id: number }[]>('POST', '/agendamentos', {
    token: medico.token,
    json: {
      gestante: gestanteId,
      itens: [{ tipoAtendimento: exame.id, dataPrevista: data, observacao: marca }],
    },
  })
  if (!agendamento) throw new Error('O agendamento não voltou na resposta.')
  return { id: agendamento.id, exame }
}

// Exame agendado para hoje e confirmado: a gestante ganha os pontos. Hoje porque o agendamento recusa data
// passada e a confirmação recusa data futura
export async function darPontos(medico: Conta, gestanteId: number, marca: string) {
  const { id } = await agendar(medico, gestanteId, hoje(), marca)
  const { saldoPontos } = await api<{ saldoPontos: number }>(
    'PUT',
    `/agendamentos/${id}/confirmar`,
    { token: medico.token },
  )
  return saldoPontos
}

// --- Ofertas da empresa e resgates da gestante -----------------------------------------------------------------

export const criarProduto = (empresa: Conta, nome: string, categoria?: string) =>
  api<{ id: number }>('POST', '/empresas/produtos', {
    token: empresa.token,
    form: {
      nome,
      preco: '59.90',
      descricao: `Produto de teste ${nome}`,
      ...(categoria && { categoria }),
    },
  })

// Cupom de 1 ponto: a gestante com os pontos de um exame resgata vários
export const criarCupom = (empresa: Conta, produtoId: number) =>
  api<{ id: number; descricao: string }>('POST', '/empresas/cupons', {
    token: empresa.token,
    json: { produto: produtoId, desconto: 10, dataValidade: hoje(30), pontosNecessarios: 1 },
  })

// Vigente de hoje a 30 dias
export const criarPromocao = (empresa: Conta, titulo: string, categoria = 'FRALDAS') =>
  api<{ id: number }>('POST', '/empresas/promocoes', {
    token: empresa.token,
    json: {
      titulo,
      descricao: `Promoção de teste ${titulo}`,
      desconto: 15,
      dataInicio: hoje(),
      dataFim: hoje(30),
      categoria,
    },
  })

interface Resgate {
  codigo: string
}

export const resgatarCupom = (gestante: Conta, cupomId: number) =>
  api<Resgate>('POST', `/cupons/${cupomId}/resgatar`, { token: gestante.token })

export const resgatarPromocao = (gestante: Conta, promocaoId: number) =>
  api<Resgate>('POST', `/promocoes/${promocaoId}/resgatar`, { token: gestante.token })

export const validarCodigo = (empresa: Conta, codigo: string) =>
  api('POST', '/empresas/cupons/validar', { token: empresa.token, json: { codigo } })
