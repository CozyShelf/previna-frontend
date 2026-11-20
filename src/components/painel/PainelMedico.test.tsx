import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PainelMedico } from './PainelMedico'
import { caminhosChamados, simularApi } from '@/test/api'

const PAINEL = {
  gestantesAcompanhadas: 12,
  atrasados: {
    total: 3,
    itens: [
      {
        agendamentoId: 7,
        gestanteId: 4,
        gestanteNome: 'Maria Teste',
        tipoNome: 'Ultrassom',
        categoria: 'EXAME',
        dataPrevista: '2026-11-10',
      },
    ],
  },
  proximos7Dias: {
    total: 1,
    itens: [
      {
        agendamentoId: 8,
        gestanteId: 5,
        gestanteNome: 'Joana Teste',
        tipoNome: 'Consulta de rotina',
        categoria: 'CONSULTA',
        dataPrevista: '2026-11-23',
      },
    ],
  },
  semAgendamentoPendente: { total: 1, itens: [{ gestanteId: 9, gestanteNome: 'Ana Teste' }] },
}

const VAZIO = {
  gestantesAcompanhadas: 0,
  atrasados: { total: 0, itens: [] },
  proximos7Dias: { total: 0, itens: [] },
  semAgendamentoPendente: { total: 0, itens: [] },
}

function renderizar() {
  render(
    <MemoryRouter>
      <PainelMedico />
    </MemoryRouter>,
  )
}

const secao = (titulo: string) => screen.getByRole('region', { name: titulo })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PainelMedico', () => {
  it('mostra o número de gestantes e as três listas, com o link de cada item', async () => {
    const fetch = simularApi({ '/painel/medico': [{ corpo: PAINEL }] })
    renderizar()

    const acompanhadas = await screen.findByRole('link', { name: '12 gestantes acompanhadas' })
    expect(acompanhadas).toHaveAttribute('href', '/gestantes')

    const atrasados = secao('Atrasados')
    const atrasado = within(atrasados).getByRole('link', { name: /Maria Teste/ })
    expect(atrasado).toHaveAttribute('href', '/gestantes/4')
    expect(atrasado).toHaveTextContent('Ultrassom')
    expect(atrasado).toHaveTextContent('Exame')
    expect(atrasado).toHaveTextContent('10/11/2026')

    const proximo = within(secao('Próximos 7 dias')).getByRole('link', { name: /Joana Teste/ })
    expect(proximo).toHaveAttribute('href', '/gestantes/5')
    expect(proximo).toHaveTextContent('23/11/2026')

    const semAgenda = within(secao('Gestantes sem nada agendado')).getByRole('link', {
      name: /Ana Teste/,
    })
    expect(semAgenda).toHaveAttribute('href', '/gestantes/9')

    expect(caminhosChamados(fetch)).toEqual(['/painel/medico'])
  })

  it('destaca os atrasados e mostra "e mais N" quando o total passa dos itens', async () => {
    simularApi({ '/painel/medico': [{ corpo: PAINEL }] })
    renderizar()

    const atrasados = await screen.findByRole('region', { name: 'Atrasados' })
    expect(atrasados).toHaveClass('border-red-200')
    expect(within(atrasados).getByText('(3)')).toBeInTheDocument()
    expect(within(atrasados).getByRole('link', { name: 'e mais 2' })).toHaveAttribute(
      'href',
      '/gestantes',
    )
    // Total igual ao que está na tela: sem "e mais"
    expect(within(secao('Próximos 7 dias')).queryByText(/e mais/)).not.toBeInTheDocument()
  })

  it('mostra frases positivas nas listas vazias, sem o destaque de alerta', async () => {
    simularApi({ '/painel/medico': [{ corpo: VAZIO }] })
    renderizar()

    expect(await screen.findByText('Nenhum exame ou consulta atrasado.')).toBeInTheDocument()
    expect(secao('Atrasados')).not.toHaveClass('border-red-200')
    expect(screen.getByText('Nada marcado para os próximos 7 dias.')).toBeInTheDocument()
    expect(
      screen.getByText('Todas as gestantes têm um exame ou consulta agendado.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '0 gestantes acompanhadas' })).toBeInTheDocument()
  })

  it('aguenta campos ausentes sem quebrar a tela', async () => {
    simularApi({
      '/painel/medico': [
        { corpo: { atrasados: { itens: [{ gestanteNome: 'Sem Id' }] }, proximos7Dias: null } },
      ],
    })
    renderizar()

    expect(await screen.findByText('Sem Id')).toBeInTheDocument()
    // Sem gestanteId não há para onde levar: a linha não vira link
    expect(screen.queryByRole('link', { name: /Sem Id/ })).not.toBeInTheDocument()
    expect(screen.getByText('Nada marcado para os próximos 7 dias.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /acompanhada/ })).not.toBeInTheDocument()
  })

  it('no erro mostra "Tentar de novo", que refaz a chamada', async () => {
    const fetch = simularApi({
      '/painel/medico': [{ status: 500, corpo: {} }, { corpo: PAINEL }],
    })
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o painel.',
    )
    // Os atalhos não dependem da resposta e continuam na tela
    expect(screen.getByRole('link', { name: 'Pré-cadastrar gestante' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Maria Teste')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(caminhosChamados(fetch)).toEqual(['/painel/medico', '/painel/medico'])
  })

  it('mostra "Carregando painel…" enquanto espera a resposta', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    renderizar()

    expect(screen.getByText('Carregando painel…')).toBeInTheDocument()
  })

  it('tem os atalhos para pré-cadastrar e para agendar', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    renderizar()

    const atalhos = screen.getByRole('navigation', { name: 'Atalhos' })
    expect(within(atalhos).getByRole('link', { name: 'Pré-cadastrar gestante' })).toHaveAttribute(
      'href',
      '/gestantes/pre-cadastro',
    )
    expect(
      within(atalhos).getByRole('link', { name: 'Agendar exame ou consulta' }),
    ).toHaveAttribute('href', '/gestantes')
  })
})
