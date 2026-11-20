import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ListagemComDestino } from '@/test/linhaClicavel'
import { ProdutosPage } from './ProdutosPage'

const PRODUTOS = [
  {
    id: 10,
    nome: 'Fralda RN',
    descricao: 'Pacote com 30',
    categoria: 'FRALDAS',
    preco: 39.9,
    imagemUrl: '/empresas/produtos/10/imagem',
  },
  { id: 11, nome: 'Body de algodão' },
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
    <MemoryRouter initialEntries={[{ pathname: '/produtos', state }]}>
      <ProdutosPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProdutosPage', () => {
  it('lista os produtos com categoria, preço e imagem, e travessão no que falta', async () => {
    const fetch = responder(PRODUTOS)
    renderizar()

    const fralda = (await screen.findByText('Fralda RN')).closest('tr')!
    expect(within(fralda).getByText('Pacote com 30')).toBeInTheDocument()
    expect(within(fralda).getByText('Fraldas')).toBeInTheDocument()
    expect(within(fralda).getByText(/R\$\s39,90/)).toBeInTheDocument()
    expect(fralda.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/empresas\/produtos\/10\/imagem$/),
    )

    const body = screen.getByText('Body de algodão').closest('tr')!
    expect(within(body).getAllByText('—')).toHaveLength(2)
    expect(body.querySelector('img')).toBeNull()
    expect(within(body).getByRole('link', { name: 'Editar Body de algodão' })).toHaveAttribute(
      'href',
      '/produtos/11',
    )
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/empresas\/produtos$/)
  })

  it('mostra a confirmação deixada pelo formulário', async () => {
    responder([])
    renderizar({ mensagem: 'Produto Fralda RN cadastrado com sucesso.' })

    expect(screen.getByRole('status')).toHaveTextContent('Produto Fralda RN cadastrado')
    expect(await screen.findByText('Nenhum produto cadastrado ainda.')).toBeInTheDocument()
  })

  describe('linha do produto', () => {
    it('leva à edição quando se clica em qualquer célula', async () => {
      responder(PRODUTOS)
      render(
        <ListagemComDestino caminho="/produtos">
          <ProdutosPage />
        </ListagemComDestino>,
      )

      await userEvent.click(await screen.findByText('Pacote com 30'))

      expect(screen.getByText('Aberto: /produtos/10')).toBeInTheDocument()
    })

    it('o Editar continua sendo o link da linha, para teclado e nova aba', async () => {
      responder(PRODUTOS)
      render(
        <ListagemComDestino caminho="/produtos">
          <ProdutosPage />
        </ListagemComDestino>,
      )

      const editar = await screen.findByRole('link', { name: 'Editar Body de algodão' })
      expect(editar.closest('tr')).not.toHaveAttribute('tabindex')
      await userEvent.click(editar)

      expect(screen.getByText('Aberto: /produtos/11')).toBeInTheDocument()
    })
  })
})
