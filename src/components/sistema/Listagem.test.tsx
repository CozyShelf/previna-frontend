import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Listagem, type FiltroListagem } from './Listagem'

interface Item {
  id: number
  nome: string
}

const FILTRO: FiltroListagem = {
  nome: 'situacao',
  rotulo: 'Situação',
  opcoes: [
    { valor: '', rotulo: 'Todas as situações' },
    { valor: 'ATIVA', rotulo: 'Ativa' },
  ],
}

const pagina = (itens: Item[], total = itens.length, numero = 0) => ({
  itens,
  pagina: numero,
  tamanho: 20,
  total,
  totalPaginas: Math.ceil(total / 20),
})

// Cada chamada recebe uma resposta nova (o corpo de uma Response só pode ser lido uma vez)
function responder(corpo: (url: string) => unknown, status = 200) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (url) => new Response(JSON.stringify(corpo(String(url))), { status }))
}

function renderizar(inicial = '/itens') {
  render(
    <MemoryRouter initialEntries={[inicial]}>
      <Listagem<Item>
        caminho="/itens"
        descricaoBusca="Buscar por nome"
        filtros={[FILTRO]}
        vazio={<p>Nada cadastrado</p>}
      >
        {(itens) => (
          <ul>
            {itens.map((item) => (
              <li key={item.id}>{item.nome}</li>
            ))}
          </ul>
        )}
      </Listagem>
    </MemoryRouter>,
  )
}

const ultimaUrl = (fetch: ReturnType<typeof responder>) => String(fetch.mock.calls.at(-1)?.[0])

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Listagem', () => {
  it('busca depois de parar de digitar e recomeça da primeira página', async () => {
    const fetch = responder(() => pagina([{ id: 1, nome: 'Maria' }]))
    renderizar('/itens?pagina=2')

    expect(await screen.findByText('Maria')).toBeInTheDocument()
    expect(ultimaUrl(fetch)).toMatch(/\/itens\?pagina=2$/)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'José')
    await waitFor(() => expect(ultimaUrl(fetch)).toMatch(/\/itens\?busca=Jos%C3%A9$/))
    // Uma consulta só para a palavra inteira, não uma por letra
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('filtra pela opção escolhida', async () => {
    const fetch = responder(() => pagina([{ id: 1, nome: 'Maria' }]))
    renderizar()
    await screen.findByText('Maria')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Situação' }), 'ATIVA')

    await waitFor(() => expect(ultimaUrl(fetch)).toMatch(/\/itens\?situacao=ATIVA$/))
  })

  it('pagina os resultados', async () => {
    const itens = Array.from({ length: 20 }, (_, i) => ({ id: i, nome: `Item ${i}` }))
    const fetch = responder((url) => pagina(itens, 45, url.includes('pagina=1') ? 1 : 0))
    renderizar()

    expect(await screen.findByText('1–20 de 45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(await screen.findByText('21–40 de 45')).toBeInTheDocument()
    expect(ultimaUrl(fetch)).toMatch(/\/itens\?pagina=1$/)
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()
  })

  it('distingue lista vazia de busca sem resultado e limpa os filtros', async () => {
    const fetch = responder(() => pagina([]))
    renderizar('/itens?situacao=ATIVA')

    expect(
      await screen.findByText('Nenhum resultado para a busca e os filtros escolhidos.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca e filtros' }))

    expect(await screen.findByText('Nada cadastrado')).toBeInTheDocument()
    expect(ultimaUrl(fetch)).toMatch(/\/itens$/)
  })

  it('avisa quando a lista não carrega', async () => {
    responder(() => ({}), 500)
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a lista.')
  })
})
