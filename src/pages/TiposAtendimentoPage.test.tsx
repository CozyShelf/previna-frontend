import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TipoAtendimentoPage } from './TipoAtendimentoPage'
import { TiposAtendimentoPage } from './TiposAtendimentoPage'

const MEUS = {
  itens: [
    { id: 10, nome: 'Ultrassom 4D', categoria: 'EXAME', pontosBase: 30, padrao: false },
    { id: 11, nome: 'Consulta de retorno', categoria: 'CONSULTA', pontosBase: 40, padrao: false },
  ],
  pagina: 0,
  tamanho: 20,
  total: 2,
  totalPaginas: 1,
}

// A listagem responde a lista; cadastro, edição e exclusão respondem vazio
function mockarApi(resposta: (init?: RequestInit) => Response) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (url, init) =>
      init?.method && init.method !== 'GET'
        ? resposta(init)
        : new Response(JSON.stringify(String(url).includes('/meus') ? MEUS : MEUS.itens[0])),
    )
}

const listagens = (fetch: ReturnType<typeof mockarApi>) =>
  fetch.mock.calls.filter(([url]) => String(url).includes('/tipos-atendimento/meus')).length

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TiposAtendimentoPage', () => {
  // Isolamento por médico: a listagem usa a rota do médico autenticado, sem id no caminho
  it('lista os tipos do próprio médico, com a pontuação e sem status', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    render(
      <MemoryRouter>
        <TiposAtendimentoPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ultrassom 4D')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    // O status saiu do sistema: o que some da lista é o excluído
    expect(screen.queryByText('Ativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Inativo')).not.toBeInTheDocument()
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/tipos-atendimento\/meus$/)
  })

  it('envia o cadastro com a categoria e a pontuação, sem campo de status', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    render(
      <MemoryRouter initialEntries={['/tipos-atendimento/novo']}>
        <Routes>
          <Route path="/tipos-atendimento/novo" element={<TipoAtendimentoPage />} />
          <Route path="/tipos-atendimento" element={<p>Lista de tipos</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nome'), 'Ultrassom 4D')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'EXAME')
    await userEvent.type(screen.getByLabelText('Pontuação'), '30')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar tipo' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      nome: 'Ultrassom 4D',
      categoria: 'EXAME',
      pontosBase: 30,
    })
    expect(await screen.findByText('Lista de tipos')).toBeInTheDocument()
  })

  // Na edição o formulário chega preenchido e envia PUT no id da rota
  it('carrega o tipo pelo id da URL e salva a alteração com PUT', async () => {
    const fetch = mockarApi(() => new Response('{}'))
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
    // Excluir é ação da listagem, e não do formulário
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Pontuação'))
    await userEvent.type(screen.getByLabelText('Pontuação'), '45')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(String(envio?.[0])).toMatch(/\/tipos-atendimento\/10$/)
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({
      nome: 'Ultrassom 4D',
      categoria: 'EXAME',
      pontosBase: 45,
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

  // A exclusão é lógica no backend: o tipo some da lista e o histórico da gestante continua
  it('exclui o tipo pela linha da listagem e recarrega a lista', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <MemoryRouter>
        <TiposAtendimentoPage />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Ultrassom 4D' }))

    const envio = fetch.mock.calls.find(([, init]) => init?.method === 'DELETE')
    expect(String(envio?.[0])).toMatch(/\/tipos-atendimento\/10$/)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tipo Ultrassom 4D excluído com sucesso.',
    )
    expect(listagens(fetch)).toBe(2)
  })

  // Clique sem querer não apaga nada
  it('não exclui quando o médico cancela a confirmação', async () => {
    const fetch = mockarApi(() => new Response('{}'))
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <MemoryRouter>
        <TiposAtendimentoPage />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Ultrassom 4D' }))

    expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    expect(listagens(fetch)).toBe(1)
  })

  it('avisa quando a exclusão falha', async () => {
    const fetch = mockarApi(() => new Response('{}', { status: 500 }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <MemoryRouter>
        <TiposAtendimentoPage />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Ultrassom 4D' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir o tipo Ultrassom 4D. Tente novamente.',
    )
    // A lista não é recarregada à toa quando a exclusão falha
    expect(listagens(fetch)).toBe(1)
  })
})
