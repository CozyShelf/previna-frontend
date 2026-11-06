import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TipoAtendimentoPage } from './TipoAtendimentoPage'
import { TiposAtendimentoPage } from './TiposAtendimentoPage'

const MEUS = {
  itens: [
    {
      id: 10,
      nome: 'Ultrassom 4D',
      categoria: 'EXAME',
      pontosBase: 30,
      ativo: true,
      padrao: false,
    },
    {
      id: 11,
      nome: 'Consulta de retorno',
      categoria: 'CONSULTA',
      pontosBase: 40,
      ativo: false,
      padrao: false,
    },
  ],
  pagina: 0,
  tamanho: 20,
  total: 2,
  totalPaginas: 1,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TiposAtendimentoPage', () => {
  // Isolamento por médico: a listagem usa a rota do médico autenticado, sem id no caminho
  it('lista os tipos do próprio médico, com a pontuação e o status', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(MEUS)))
    render(
      <MemoryRouter>
        <TiposAtendimentoPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ultrassom 4D')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/tipos-atendimento\/meus$/)
  })

  it('envia o cadastro com a categoria, a pontuação e o status', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/novo']}>
        <Routes>
          <Route path="/tipos-atendimento/novo" element={<TipoAtendimentoPage />} />
          <Route path="/tipos-atendimento" element={<p>Lista de tipos</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Nome'), 'Ultrassom 4D')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'EXAME')
    await userEvent.type(screen.getByLabelText('Pontuação'), '30')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar tipo' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      nome: 'Ultrassom 4D',
      categoria: 'EXAME',
      pontosBase: 30,
      ativo: true,
    })
    expect(await screen.findByText('Lista de tipos')).toBeInTheDocument()
  })

  // Na edição o formulário chega preenchido e envia PUT no id da rota
  it('carrega o tipo pelo id da URL e salva a alteração com PUT', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (_url, init) =>
        init?.method === 'PUT' ? new Response('{}') : new Response(JSON.stringify(MEUS.itens[0])),
      )
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/10']}>
        <Routes>
          <Route path="/tipos-atendimento/:id" element={<TipoAtendimentoPage />} />
          <Route path="/tipos-atendimento" element={<p>Lista de tipos</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('Nome')).toHaveValue('Ultrassom 4D')
    expect(screen.getByLabelText('Categoria')).toHaveValue('EXAME')
    expect(screen.getByLabelText('Pontuação')).toHaveValue(30)
    expect(screen.getByLabelText('Status')).toHaveValue('true')

    // Desativar é feito por aqui, e não por uma ação à parte
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(String(envio?.[0])).toMatch(/\/tipos-atendimento\/10$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      nome: 'Ultrassom 4D',
      categoria: 'EXAME',
      pontosBase: 30,
      ativo: false,
    })
    expect(await screen.findByText('Lista de tipos')).toBeInTheDocument()
  })

  it('não chama a API com um id que não é número', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/..%2F..%2Fmedicos']}>
        <Routes>
          <Route path="/tipos-atendimento/:id" element={<TipoAtendimentoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/não foi possível carregar o tipo/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  // Excluir um tipo já usado é recusado com 409; o caminho é desativar
  it('explica que o tipo já usado deve ser desativado em vez de excluído', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) =>
      init?.method === 'DELETE'
        ? new Response('{}', { status: 409 })
        : new Response(JSON.stringify(MEUS.itens[0])),
    )
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/10']}>
        <Routes>
          <Route path="/tipos-atendimento/:id" element={<TipoAtendimentoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este tipo já tem exames ou consultas cadastrados. Mude o status para inativo em vez de excluir.',
    )
  })

  it('avisa quando não consegue carregar o tipo para edição', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/10']}>
        <Routes>
          <Route path="/tipos-atendimento/:id" element={<TipoAtendimentoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Carregando tipo…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o tipo.')
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
  })
})
