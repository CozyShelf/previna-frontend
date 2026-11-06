import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { usePerfil, useRecarregarPerfil } from '@/hooks/usePerfil'
import { entrarComo } from '@/test/sessao'
import { SistemaLayout } from './SistemaLayout'

// Página filha que usa o perfil passado pelo layout
function Pagina() {
  const perfil = usePerfil()
  const recarregar = useRecarregarPerfil()
  return (
    <>
      <p>Olá, {perfil?.login ?? '…'}</p>
      <button onClick={recarregar}>Recarregar</button>
    </>
  )
}

function renderizar() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <SistemaLayout />,
        handle: { titulo: 'Início' },
        children: [{ index: true, element: <Pagina /> }],
      },
    ],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('SistemaLayout', () => {
  it('monta menu, trilha e perfil, e repassa o perfil às páginas', async () => {
    entrarComo('ADMIN')
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ nome: 'Admin Geral', login: 'admin' })))
    renderizar()

    expect(await screen.findByText('Olá, admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /admin geral/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toHaveTextContent('Médicos')
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toHaveTextContent(
      'Início',
    )
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/auth\/perfil$/)
  })

  it('recarrega o perfil quando a página pede', async () => {
    entrarComo('EMPRESA_PARCEIRA')
    const fetch = vi.spyOn(globalThis, 'fetch')
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ nome: 'Loja', login: 'antigo' })))
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ nome: 'Loja', login: 'novo' })))
    renderizar()

    await screen.findByText('Olá, antigo')
    await userEvent.click(screen.getByRole('button', { name: 'Recarregar' }))

    expect(await screen.findByText('Olá, novo')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
