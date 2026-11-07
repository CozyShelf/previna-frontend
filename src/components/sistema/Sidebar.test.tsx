import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { entrarComo } from '@/test/sessao'
import { Sidebar } from './Sidebar'

function renderizar(caminho = '/') {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Sidebar />
    </MemoryRouter>,
  )
  return within(screen.getByRole('navigation', { name: 'Menu principal' }))
}

const itens = (menu: ReturnType<typeof renderizar>) =>
  menu.queryAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])

afterEach(() => {
  localStorage.clear()
})

describe('Sidebar', () => {
  it.each([
    [
      'MEDICO',
      [
        ['Início', '/'],
        ['Gestantes', '/gestantes'],
        ['Tipos de atendimento', '/tipos-atendimento'],
      ],
    ],
    [
      'ADMIN',
      [
        ['Início', '/'],
        ['Médicos', '/medicos'],
        ['Empresas parceiras', '/empresas'],
        ['Conteúdo educativo', '/conteudos'],
      ],
    ],
    [
      'EMPRESA_PARCEIRA',
      [
        ['Início', '/'],
        ['Produtos', '/produtos'],
        ['Promoções', '/promocoes'],
        ['Cupons', '/cupons'],
      ],
    ],
  ])('o perfil %s vê só os itens do seu papel', (perfil, esperados) => {
    entrarComo(perfil)

    expect(itens(renderizar())).toEqual(esperados)
  })

  it('sem sessão não vê nenhum item', () => {
    expect(itens(renderizar())).toEqual([])
  })

  it('perfil sem acesso ao web (gestante) não vê nenhum item', () => {
    entrarComo('GESTANTE')

    expect(itens(renderizar())).toEqual([])
  })

  it('marca a página atual, e o Início só na raiz', () => {
    entrarComo('MEDICO')
    const menu = renderizar('/gestantes/7')

    expect(menu.getByRole('link', { name: 'Gestantes' })).toHaveAttribute('aria-current', 'page')
    expect(menu.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })
})
