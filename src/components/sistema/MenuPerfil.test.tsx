import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { MenuPerfil } from '@/components/sistema/MenuPerfil'
import type { Perfil } from '@/hooks/usePerfil'
import { obterToken } from '@/lib/auth'
import { entrarComo } from '@/test/sessao'

const EMPRESA: Perfil = { nome: 'Farmácia Bem Nascer', login: 'bemnascer', cnpj: '11222333000181' }

function renderizar(perfil: Perfil = EMPRESA) {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <MenuPerfil perfil={perfil} />
              <p>Fora do menu</p>
            </>
          }
        />
        <Route path="/perfil" element={<p>Página de perfil</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return container
}

const abrir = () => userEvent.click(screen.getByRole('button', { name: /farmácia bem nascer/i }))

afterEach(() => {
  localStorage.clear()
})

describe('MenuPerfil', () => {
  it('mostra o logo da empresa no avatar', () => {
    const img = renderizar({ ...EMPRESA, logoUrl: '/empresas/1/logo' }).querySelector('img')

    expect(img).toHaveAttribute('src', expect.stringMatching(/\/empresas\/1\/logo$/))
  })

  it('sem logo, mostra as iniciais', () => {
    const container = renderizar()

    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('FN')
  })

  it('abre o menu com o nome e o CNPJ da empresa', async () => {
    renderizar()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await abrir()

    expect(screen.getByRole('button', { name: /farmácia bem nascer/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByRole('menu')).toHaveTextContent('CNPJ 11.222.333/0001-81')
  })

  it('fecha com Esc, com clique fora e com novo clique no botão', async () => {
    renderizar()

    await abrir()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await abrir()
    await userEvent.keyboard('a')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Fora do menu'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await abrir()
    await userEvent.click(screen.getByRole('menu'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await abrir()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('"Meu perfil" leva à página de perfil', async () => {
    renderizar()

    await abrir()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Meu perfil' }))

    expect(screen.getByText('Página de perfil')).toBeInTheDocument()
  })

  it('"Sair" encerra a sessão e volta ao login', async () => {
    entrarComo('EMPRESA_PARCEIRA')
    renderizar()

    await abrir()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sair' }))

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(obterToken()).toBeNull()
  })

  it.each<[string, Perfil, string]>([
    ['médico', { nome: 'Dra. Ana Lima', login: 'ana', crm: 'CRM/SP 123456' }, 'CRM/SP 123456'],
    ['administrador', { nome: 'Admin Geral', login: 'admin' }, 'Administrador'],
  ])('identifica o %s no menu', async (_, perfil, identificacao) => {
    renderizar(perfil)

    await userEvent.click(screen.getByRole('button', { name: new RegExp(perfil.nome) }))

    expect(screen.getByRole('menu')).toHaveTextContent(identificacao)
  })

  it('enquanto o perfil carrega, o botão aparece sem nome', () => {
    render(
      <MemoryRouter>
        <MenuPerfil />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'menu')
  })
})
