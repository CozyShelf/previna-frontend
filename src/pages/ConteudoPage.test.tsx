import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConteudoPage } from '@/pages/ConteudoPage'

function renderizar(caminho: string) {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/conteudos/novo" element={<ConteudoPage />} />
        <Route path="/conteudos/:id" element={<ConteudoPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ConteudoPage', () => {
  it('sem id mostra o cadastro, sem chamar a API', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar('/conteudos/novo')

    expect(screen.getByRole('heading', { name: 'Cadastrar conteúdo' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('carrega o conteúdo pelo id da URL para editar', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 5,
          titulo: 'Sinais de alerta',
          categoria: 'DICA',
          tipo: 'TEXTO',
          corpo: 'Procure o médico se sentir dor forte.',
          publicado: false,
          criadoEm: '2026-11-01T10:00:00',
        }),
      ),
    )
    renderizar('/conteudos/5')

    expect(screen.getByRole('heading', { name: 'Editar conteúdo' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Título')).toHaveValue('Sinais de alerta')
    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/conteudos\/5$/)
  })

  it('não chama a API com um id que não é número', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar('/conteudos/..%2F..%2Fmedicos')

    expect(screen.getByText(/não foi possível carregar o conteúdo/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('avisa quando não consegue carregar o conteúdo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }))
    renderizar('/conteudos/5')

    expect(screen.getByText('Carregando conteúdo…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o conteúdo.',
    )
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  })
})
