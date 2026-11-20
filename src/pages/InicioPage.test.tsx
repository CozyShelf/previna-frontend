import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InicioPage } from './InicioPage'
import { encerrarSessao, salvarToken } from '@/lib/auth'
import { caminhosChamados, simularApi } from '@/test/api'
import { entrarComo } from '@/test/sessao'

const ATENDIMENTOS = [
  {
    id: 2,
    gestante: 7,
    nomeGestante: 'Maria Teste',
    tipo: 'Hemograma completo',
    categoria: 'EXAME',
  },
  {
    id: 5,
    gestante: 9,
    nomeGestante: 'Joana Teste',
    tipo: 'Consulta puerperal',
    categoria: 'CONSULTA',
  },
]

// O token do médico é o que liga a agenda: a tela inicial dos outros perfis não a mostra
function entrarComoMedico(perfil = 'MEDICO') {
  const payload = btoa(JSON.stringify({ perfil, primeiroAcesso: false, exp: 2 ** 40 }))
  salvarToken(`cabecalho.${payload}.assinatura`)
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/gestantes/:id" element={<p>Detalhe da gestante</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const PAINEL_MEDICO = {
  gestantesAcompanhadas: 2,
  atrasados: { total: 0, itens: [] },
  proximos7Dias: { total: 0, itens: [] },
  semAgendamentoPendente: { total: 0, itens: [] },
}

const agenda = () => screen.getByRole('region', { name: 'Exames e consultas de hoje' })

vi.mock('@/hooks/usePerfil', () => ({ usePerfil: () => ({ nome: 'Dra. Ana', login: 'ana' }) }))

beforeEach(() => {
  // Sem resposta definida no teste, a API fica pendente: o painel continua "carregando" e não muda a tela
  // depois que o teste já conferiu a saudação
  vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
})

afterEach(() => {
  vi.useRealTimers()
  encerrarSessao()
  vi.restoreAllMocks()
})

describe('InicioPage', () => {
  it('lista os exames e consultas de hoje, na ordem que a API devolve', async () => {
    simularApi({
      '/agendamentos/hoje': [{ corpo: ATENDIMENTOS }],
      '/painel/medico': [{ corpo: PAINEL_MEDICO }],
    })
    entrarComoMedico()
    renderizar()

    expect(await screen.findByText('Maria Teste')).toBeInTheDocument()
    expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
    const linhas = within(agenda()).getAllByRole('link')
    expect(linhas.map((linha) => linha.textContent)).toEqual([
      'Maria TesteHemograma completoExame',
      'Joana TesteConsulta puerperalConsulta',
    ])
    // Cada item leva ao detalhe da sua gestante
    expect(linhas[0]).toHaveAttribute('href', '/gestantes/7')
  })

  it('mostra um estado vazio amigável quando não há nada para hoje', async () => {
    simularApi({
      '/agendamentos/hoje': [{ corpo: [] }],
      '/painel/medico': [{ corpo: PAINEL_MEDICO }],
    })
    entrarComoMedico()
    renderizar()

    expect(await screen.findByText(/nada marcado para hoje/i)).toBeInTheDocument()
    expect(within(agenda()).queryByRole('link')).not.toBeInTheDocument()
  })

  it('mostra a agenda do dia antes do painel do médico', async () => {
    simularApi({
      '/agendamentos/hoje': [{ corpo: ATENDIMENTOS }],
      '/painel/medico': [{ corpo: PAINEL_MEDICO }],
    })
    entrarComoMedico()
    renderizar()

    const atrasados = await screen.findByRole('region', { name: 'Atrasados' })
    expect(agenda().compareDocumentPosition(atrasados)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('um erro no painel não esconde a saudação nem a agenda do dia', async () => {
    simularApi({
      '/agendamentos/hoje': [{ corpo: ATENDIMENTOS }],
      '/painel/medico': [{ status: 500, corpo: {} }],
    })
    entrarComoMedico()
    renderizar()

    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dra. Ana')
    expect(await within(agenda()).findByText('Maria Teste')).toBeInTheDocument()
  })

  it.each([
    ['MEDICO', ['/agendamentos/hoje', '/painel/medico'], 'Atrasados'],
    ['EMPRESA_PARCEIRA', ['/painel/empresa'], 'Cupons que vencem em 7 dias'],
    ['ADMIN', ['/painel/admin'], 'Atividade recente'],
  ])('o perfil %s chama só a sua rota', async (perfil, caminhos, secao) => {
    const fetch = simularApi({
      '/agendamentos/hoje': [{ corpo: [] }],
      '/painel/medico': [{ corpo: PAINEL_MEDICO }],
      '/painel/empresa': [{ corpo: {} }],
      '/painel/admin': [{ corpo: {} }],
    })
    entrarComo(perfil)
    renderizar()

    expect(await screen.findByRole('region', { name: secao })).toBeInTheDocument()
    expect(caminhosChamados(fetch).sort()).toEqual(caminhos)
    // A agenda do dia é só do médico
    expect(screen.queryByText('Exames e consultas de hoje') !== null).toBe(perfil === 'MEDICO')
  })

  it('não mostra painel nem chama a API para outro perfil', () => {
    const fetch = simularApi({})
    entrarComo('GESTANTE')
    renderizar()

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    [1, 'Boa noite, Dra. Ana'],
    [9, 'Bom dia, Dra. Ana'],
    [14, 'Boa tarde, Dra. Ana'],
    [21, 'Boa noite, Dra. Ana'],
  ])('às %ih cumprimenta com "%s"', (hora, saudacao) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2030, 0, 15, hora))
    entrarComo('ADMIN')
    renderizar()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(saudacao)
  })

  it('troca a saudação e a data com a aba aberta, sem recarregar', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date(2030, 0, 15, 11, 59))
    entrarComo('ADMIN')
    renderizar()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bom dia, Dra. Ana')
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Boa tarde, Dra. Ana')

    // Da meia-noite em diante a data também vira
    vi.setSystemTime(new Date(2030, 0, 15, 23, 58, 30))
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText(/terça-feira, 15 de janeiro de 2030/i)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText(/quarta-feira, 16 de janeiro de 2030/i)).toBeInTheDocument()
  })

  it('limpa o timer ao sair da tela', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    entrarComo('ADMIN')
    const { unmount } = renderizar()

    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
