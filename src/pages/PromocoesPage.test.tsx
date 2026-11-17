import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cliqueDuplo, escritas } from '@/test/cliqueDuplo'
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
    ativo: true,
  },
  {
    id: 2,
    titulo: 'Inverno',
    desconto: 20,
    dataInicio: '2030-06-01',
    dataFim: '2030-06-30',
    categoria: 'ROUPAS',
    ativo: false,
  },
]

// GET devolve a lista; PUT devolve a primeira promoção com a situação pedida, ou o status de erro dado
function responder(itens: unknown[], statusPut = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => {
    if (init?.method === 'PUT') {
      const { ativo } = JSON.parse(String(init.body))
      return new Response(JSON.stringify({ ...PROMOCOES[0], ativo }), { status: statusPut })
    }
    return new Response(
      JSON.stringify({ itens, pagina: 0, tamanho: 20, total: itens.length, totalPaginas: 1 }),
    )
  })
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
    expect(within(semana).getByText('Ativa')).toBeInTheDocument()

    const inverno = screen.getByText('Inverno').closest('tr')!
    expect(within(inverno).getByText('Roupas')).toBeInTheDocument()
    expect(within(inverno).getByText('20%')).toBeInTheDocument()
    expect(within(inverno).getByText('Inativa')).toBeInTheDocument()
    expect(within(inverno).getByRole('button', { name: 'Ativar Inverno' })).toBeInTheDocument()
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

  it('desativa e reativa a promoção', async () => {
    const fetch = responder([PROMOCOES[0]])
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar Semana do bebê' }))

    expect(await screen.findByText('Inativa')).toBeInTheDocument()
    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/empresas\/promocoes\/1\/ativo$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ ativo: false })

    await userEvent.click(screen.getByRole('button', { name: 'Ativar Semana do bebê' }))
    expect(await screen.findByText('Ativa')).toBeInTheDocument()
  })

  it('mantém a situação e avisa quando não consegue alterar', async () => {
    responder([PROMOCOES[0]], 500)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /desativar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível alterar')
    expect(screen.getByText('Ativa')).toBeInTheDocument()
  })

  it('com 409 ao ativar, explica a promoção sobreposta e a linha continua inativa', async () => {
    const fetch = responder([PROMOCOES[1]], 409)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ativar Inverno' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível ativar: já existe outra promoção ativa dessa categoria nesse período.',
    )
    expect(screen.getByText('Inativa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar Inverno' })).toBeEnabled()
    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/empresas\/promocoes\/2\/ativo$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ ativo: true })
  })

  it('desativa uma vez só no clique duplo', async () => {
    const fetch = responder([PROMOCOES[0]])
    renderizar()

    cliqueDuplo(await screen.findByRole('button', { name: 'Desativar Semana do bebê' }))

    expect(await screen.findByText('Inativa')).toBeInTheDocument()
    expect(escritas(fetch)).toHaveLength(1)
  })
})
