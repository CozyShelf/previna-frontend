import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CadastroAgendamentoPage } from './CadastroAgendamentoPage'
import { CadastroCupomPage } from './CadastroCupomPage'
import { CadastroPromocaoPage } from './CadastroPromocaoPage'

// Páginas que só juntam o cabeçalho e o formulário (os formulários têm testes próprios)
afterEach(() => {
  vi.restoreAllMocks()
})

describe('páginas de cadastro', () => {
  it('CadastroAgendamentoPage mostra o formulário do exame ou consulta da gestante', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
    render(
      <MemoryRouter initialEntries={['/gestantes/7/agendamentos/novo']}>
        <Routes>
          <Route path="/gestantes/:id/agendamentos/novo" element={<CadastroAgendamentoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Cadastrar exame ou consulta' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /salvar|cadastrar/i })).toBeInTheDocument()
  })

  it('CadastroCupomPage mostra o formulário do cupom', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          itens: [{ id: 1, nome: 'Fralda RN' }],
          pagina: 0,
          tamanho: 100,
          total: 1,
          totalPaginas: 1,
        }),
      ),
    )
    render(
      <MemoryRouter>
        <CadastroCupomPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Cadastrar cupom' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Produto')).toBeInTheDocument()
  })

  it('CadastroPromocaoPage mostra o formulário da promoção', () => {
    render(
      <MemoryRouter>
        <CadastroPromocaoPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Cadastrar promoção' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
  })
})
