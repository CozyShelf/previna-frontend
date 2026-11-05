import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConteudosPage } from './ConteudosPage'

const PAGINA = {
  itens: [
    {
      id: 10,
      titulo: 'Alimentação na gestação',
      categoria: 'DICA',
      tipo: 'TEXTO',
      resumo: 'Coma de tudo um pouco',
      publicado: true,
      criadoEm: '2026-11-01T10:00:00',
      publicadoEm: '2026-11-01T11:00:00',
    },
    {
      id: 11,
      titulo: 'Calendário de vacinação',
      categoria: 'NOTICIA',
      tipo: 'LINK',
      midiaUrl: 'https://www.gov.br/saude',
      publicado: false,
      criadoEm: '2026-11-02T10:00:00',
    },
  ],
  pagina: 0,
  tamanho: 20,
  total: 2,
  totalPaginas: 1,
}

// A listagem responde a lista; a exclusão responde o que o teste pedir
function mockarApi(resposta: () => Response) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (_url, init) =>
      init?.method && init.method !== 'GET' ? resposta() : new Response(JSON.stringify(PAGINA)),
    )
}

const listagens = (fetch: ReturnType<typeof mockarApi>) =>
  fetch.mock.calls.filter(([, init]) => !init?.method || init.method === 'GET').length

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ConteudosPage', () => {
  it('lista os conteúdos com categoria, tipo e situação', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(PAGINA)))
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Alimentação na gestação')).toBeInTheDocument()
    // Dentro da tabela: os mesmos rótulos também são opções dos filtros
    const tabela = within(screen.getByRole('table'))
    expect(tabela.getByText('Dica')).toBeInTheDocument()
    expect(tabela.getByText('Texto')).toBeInTheDocument()
    expect(tabela.getByText('Notícia')).toBeInTheDocument()
    expect(tabela.getByText('Link')).toBeInTheDocument()
    // Rascunho e publicado são distinguidos na lista: só o publicado aparece no app
    expect(tabela.getByText('Publicado')).toBeInTheDocument()
    expect(tabela.getByText('Rascunho')).toBeInTheDocument()
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/conteudos$/)
  })

  it('filtra pela situação pela URL da listagem', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(PAGINA)))
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )
    await screen.findByText('Alimentação na gestação')

    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'false')

    expect(String(fetch.mock.calls.at(-1)?.[0])).toMatch(/\/conteudos\?publicado=false$/)
  })

  it('leva ao cadastro e à edição', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(PAGINA)))
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<ConteudosPage />} />
          <Route path="/conteudos/novo" element={<p>Formulário de cadastro</p>} />
          <Route path="/conteudos/:id" element={<p>Formulário de edição</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('link', { name: 'Editar Alimentação na gestação' }),
    ).toHaveAttribute('href', '/conteudos/10')

    await userEvent.click(screen.getByRole('link', { name: /cadastrar conteúdo/i }))
    expect(await screen.findByText('Formulário de cadastro')).toBeInTheDocument()
  })

  // Excluir tira o conteúdo do app das gestantes e apaga a imagem junto; não dá para desfazer
  it('exclui o conteúdo pela linha da listagem e recarrega a lista', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )

    await userEvent.click(
      await screen.findByRole('button', { name: 'Excluir Alimentação na gestação' }),
    )

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')
    expect(String(envio?.[0])).toMatch(/\/conteudos\/10$/)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Conteúdo Alimentação na gestação excluído com sucesso.',
    )
    expect(listagens(fetch)).toBe(2)
  })

  it('não exclui quando o admin cancela a confirmação', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )

    await userEvent.click(
      await screen.findByRole('button', { name: 'Excluir Alimentação na gestação' }),
    )

    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    expect(listagens(fetch)).toBe(1)
  })

  it('avisa quando a exclusão falha', async () => {
    const fetch = mockarApi(() => new Response('{}', { status: 500 }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )

    await userEvent.click(
      await screen.findByRole('button', { name: 'Excluir Alimentação na gestação' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir o conteúdo Alimentação na gestação. Tente novamente.',
    )
    expect(listagens(fetch)).toBe(1)
  })

  it('mostra o estado vazio quando ainda não há conteúdo cadastrado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ itens: [], pagina: 0, tamanho: 20, total: 0, totalPaginas: 0 }),
      ),
    )
    render(
      <MemoryRouter>
        <ConteudosPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Nenhum conteúdo cadastrado ainda.')).toBeInTheDocument()
  })
})
