import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { rotas } from '@/routes'
import { entrarComo } from '@/test/sessao'

function abrir(caminho: string) {
  // O layout busca o perfil de quem está logado
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ nome: 'Loja', login: 'loja' })),
  )
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [caminho] })} />)
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('rotas', () => {
  it('a empresa parceira abre Validar cupom pelo menu, com a trilha', async () => {
    entrarComo('EMPRESA_PARCEIRA')
    abrir('/validar-cupom')

    expect(await screen.findByRole('heading', { name: 'Validar cupom' })).toBeInTheDocument()
    const menu = within(screen.getByRole('navigation', { name: 'Menu principal' }))
    expect(menu.getByRole('link', { name: 'Validar cupom' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const trilha = within(screen.getByRole('navigation', { name: 'Trilha de navegação' }))
    expect(trilha.getByText('Validar cupom')).toBeInTheDocument()
  })

  it.each(['ADMIN', 'MEDICO'])(
    'o perfil %s não abre Validar cupom e volta ao início',
    async (perfil) => {
      entrarComo(perfil)
      abrir('/validar-cupom')

      expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(
        'Validar cupom',
      )
      expect(screen.queryByRole('textbox', { name: 'Código' })).not.toBeInTheDocument()
    },
  )
})
