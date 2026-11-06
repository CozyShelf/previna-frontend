import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InicioPage } from './InicioPage'
import { encerrarSessao, salvarToken } from '@/lib/auth'
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
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/gestantes/:id" element={<p>Detalhe da gestante</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

vi.mock('@/hooks/usePerfil', () => ({ usePerfil: () => ({ nome: 'Dra. Ana', login: 'ana' }) }))

afterEach(() => {
  vi.useRealTimers()
  encerrarSessao()
  vi.restoreAllMocks()
})

describe('InicioPage', () => {
  it('lista os exames e consultas de hoje, na ordem que a API devolve', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(ATENDIMENTOS)))
    entrarComoMedico()
    renderizar()

    expect(await screen.findByText('Maria Teste')).toBeInTheDocument()
    expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
    const linhas = screen.getAllByRole('link')
    expect(linhas.map((linha) => linha.textContent)).toEqual([
      'Maria TesteHemograma completoExame',
      'Joana TesteConsulta puerperalConsulta',
    ])
    // Cada item leva ao detalhe da sua gestante
    expect(linhas[0]).toHaveAttribute('href', '/gestantes/7')
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/agendamentos\/hoje$/)
  })

  it('mostra um estado vazio amigável quando não há nada para hoje', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
    entrarComoMedico()
    renderizar()

    expect(await screen.findByText(/nada marcado para hoje/i)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('não busca a agenda para quem não é médico', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    entrarComoMedico('EMPRESA_PARCEIRA')
    renderizar()

    expect(screen.queryByText('Exames e consultas de hoje')).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
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
})
