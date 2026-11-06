import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PromocoesPage } from './PromocoesPage'

const PROMOCOES = [
  {
    id: 1,
    titulo: 'Semana do bebê',
    descricao: 'Só nesta semana',
    desconto: 12.5,
    dataInicio: '2030-01-01',
    dataFim: '2030-01-07',
    categoria: 'FRALDAS',
  },
  {
    id: 2,
    titulo: 'Inverno',
    desconto: 20,
    dataInicio: '2030-06-01',
    dataFim: '2030-06-30',
    categoria: 'ROUPAS',
  },
]

function responder(itens: unknown[]) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ itens, pagina: 0, tamanho: 20, total: itens.length, totalPaginas: 1 }),
        ),
    )
}

function renderizar(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/promocoes', state }]}>
      <PromocoesPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PromocoesPage', () => {
  it('lista as promoções com categoria, desconto e vigência', async () => {
    const fetch = responder(PROMOCOES)
    renderizar()

    const semana = (await screen.findByText('Semana do bebê')).closest('tr')!
    expect(within(semana).getByText('Só nesta semana')).toBeInTheDocument()
    expect(within(semana).getByText('Fraldas')).toBeInTheDocument()
    expect(within(semana).getByText('12,5%')).toBeInTheDocument()
    expect(within(semana).getByText('01/01/2030 a 07/01/2030')).toBeInTheDocument()

    const inverno = screen.getByText('Inverno').closest('tr')!
    expect(within(inverno).getByText('Roupas')).toBeInTheDocument()
    expect(within(inverno).getByText('20%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cadastrar promoção/i })).toHaveAttribute(
      'href',
      '/promocoes/novo',
    )
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/empresas\/promocoes$/)
  })

  it('mostra a confirmação deixada pelo formulário e o estado vazio', async () => {
    responder([])
    renderizar({ mensagem: 'Promoção Inverno cadastrada com sucesso.' })

    expect(screen.getByRole('status')).toHaveTextContent('Promoção Inverno cadastrada')
    expect(await screen.findByText('Nenhuma promoção cadastrada ainda.')).toBeInTheDocument()
  })
})
