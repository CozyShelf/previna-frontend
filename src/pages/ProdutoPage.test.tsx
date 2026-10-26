import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProdutoPage } from '@/pages/ProdutoPage'

function renderizar(caminho: string) {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/produtos/:id" element={<ProdutoPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProdutoPage', () => {
  it('carrega o produto pelo id da URL para editar', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 5, nome: 'Fralda RN' })))
    renderizar('/produtos/5')

    expect(await screen.findByLabelText('Nome')).toHaveValue('Fralda RN')
    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/empresas\/produtos\/5$/)
  })

  it('não chama a API com um id que não é número', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar('/produtos/..%2F..%2Fmedicos')

    expect(screen.getByText(/não foi possível carregar o produto/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
