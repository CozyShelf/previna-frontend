import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CuponsPage } from '@/pages/CuponsPage'

const CUPOM = {
  id: 7,
  descricao: '10% de desconto em Fralda RN',
  produto: 'Fralda RN',
  desconto: 10,
  dataValidade: '2030-01-31',
  pontosNecessarios: 1500,
  ativo: true,
}

// GET devolve a lista; PUT devolve o cupom com a situação pedida, ou o status de erro dado
function responder(statusPut = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, init) => {
    if (init?.method === 'PUT') {
      const { ativo } = JSON.parse(String(init.body))
      return new Response(JSON.stringify({ ...CUPOM, ativo }), { status: statusPut })
    }
    return new Response(
      JSON.stringify({ itens: [CUPOM], pagina: 0, tamanho: 20, total: 1, totalPaginas: 1 }),
    )
  })
}

function renderizar() {
  render(
    <MemoryRouter>
      <CuponsPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CuponsPage', () => {
  it('lista com a descrição montada, sem campo de busca', async () => {
    responder()
    renderizar()

    expect(await screen.findByText('10% de desconto em Fralda RN')).toBeInTheDocument()
    expect(screen.getByText('31/01/2030')).toBeInTheDocument()
    expect(screen.getByText('1.500')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('desativa e reativa o cupom', async () => {
    const fetch = responder()
    renderizar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Desativar 10% de desconto em Fralda RN' }),
    )

    expect(await screen.findByText('Inativo')).toBeInTheDocument()
    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(envio?.[0]).toMatch(/\/empresas\/cupons\/7\/ativo$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ ativo: false })

    await userEvent.click(
      screen.getByRole('button', { name: 'Ativar 10% de desconto em Fralda RN' }),
    )
    expect(await screen.findByText('Ativo')).toBeInTheDocument()
  })

  it('mantém a situação e avisa quando não consegue alterar', async () => {
    responder(500)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: /desativar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível alterar')
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })
})
