import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Trilha, type HandleRota } from './Trilha'

const titulo = (texto: string): HandleRota => ({ titulo: texto })

function Layout() {
  return (
    <>
      <Trilha />
      <Outlet />
    </>
  )
}

function renderizar(caminho: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        handle: titulo('Início'),
        children: [
          { index: true, element: <p>Tela inicial</p> },
          {
            path: 'medicos',
            handle: titulo('Médicos'),
            children: [
              { index: true, element: <p>Lista de médicos</p> },
              { path: 'novo', element: <p>Novo médico</p>, handle: titulo('Cadastro') },
            ],
          },
        ],
      },
    ],
    { initialEntries: [caminho] },
  )
  render(<RouterProvider router={router} />)
  return within(screen.getByRole('navigation', { name: 'Trilha de navegação' }))
}

describe('Trilha', () => {
  it('na raiz mostra só o Início, sem botão de voltar', () => {
    const trilha = renderizar('/')

    expect(trilha.getByText('Início')).toHaveAttribute('aria-current', 'page')
    expect(trilha.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Voltar' })).not.toBeInTheDocument()
  })

  it('monta os níveis com links, deixando a página atual como texto', () => {
    const trilha = renderizar('/medicos/novo')

    expect(trilha.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Início',
      'Médicos',
      'Cadastro',
    ])
    expect(trilha.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(trilha.getByRole('link', { name: 'Médicos' })).toHaveAttribute('href', '/medicos')
    expect(trilha.getByText('Cadastro')).toHaveAttribute('aria-current', 'page')
  })

  it('o botão voltar leva ao nível anterior', async () => {
    renderizar('/medicos/novo')

    await userEvent.click(screen.getByRole('link', { name: 'Voltar' }))

    expect(screen.getByText('Lista de médicos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/')
  })
})
