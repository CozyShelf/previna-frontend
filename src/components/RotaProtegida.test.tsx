import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useOutletContext } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { RotaProtegida } from '@/components/RotaProtegida'
import { salvarToken } from '@/lib/auth'
import { entrarComo } from '@/test/sessao'

function token(primeiroAcesso: boolean) {
  const payload = { perfil: 'EMPRESA_PARCEIRA', primeiroAcesso, exp: Date.now() / 1000 + 60 }
  return `x.${btoa(JSON.stringify(payload))}.y`
}

function renderizar() {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<RotaProtegida />}>
          <Route path="/" element={<p>Painel</p>} />
        </Route>
        <Route path="/primeiro-acesso" element={<p>Primeiro acesso</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('RotaProtegida', () => {
  it('leva ao login quem não tem sessão', () => {
    renderizar()

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Painel')).not.toBeInTheDocument()
  })

  it('leva quem ainda usa a senha temporária ao primeiro acesso', () => {
    salvarToken(token(true))
    renderizar()

    expect(screen.getByText('Primeiro acesso')).toBeInTheDocument()
  })

  it('libera o sistema depois do primeiro acesso', () => {
    salvarToken(token(false))
    renderizar()

    expect(screen.getByText('Painel')).toBeInTheDocument()
  })
})

describe('RotaProtegida com perfis', () => {
  // Layout de cima que passa um contexto, como o SistemaLayout
  function Layout() {
    return <Outlet context="contexto do layout" />
  }

  function Pagina() {
    return <p>Página da empresa: {String(useOutletContext())}</p>
  }

  function renderizarRestrita() {
    render(
      <MemoryRouter initialEntries={['/restrita']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<p>Início</p>} />
            <Route element={<RotaProtegida perfis={['EMPRESA_PARCEIRA']} />}>
              <Route path="/restrita" element={<Pagina />} />
            </Route>
          </Route>
          <Route path="/primeiro-acesso" element={<p>Primeiro acesso</p>} />
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('libera o perfil da lista e repassa o contexto do layout', () => {
    entrarComo('EMPRESA_PARCEIRA')
    renderizarRestrita()

    expect(screen.getByText('Página da empresa: contexto do layout')).toBeInTheDocument()
  })

  it.each(['MEDICO', 'ADMIN'])('leva o perfil %s, fora da lista, ao início', (perfil) => {
    entrarComo(perfil)
    renderizarRestrita()

    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.queryByText(/Página da empresa/)).not.toBeInTheDocument()
  })

  it('continua levando ao login quem não tem sessão', () => {
    renderizarRestrita()

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('continua levando ao primeiro acesso quem usa a senha temporária', () => {
    entrarComo('EMPRESA_PARCEIRA', true)
    renderizarRestrita()

    expect(screen.getByText('Primeiro acesso')).toBeInTheDocument()
  })
})
