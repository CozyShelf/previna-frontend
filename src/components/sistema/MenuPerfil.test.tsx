import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { MenuPerfil } from '@/components/sistema/MenuPerfil'

function renderizar(logoUrl?: string) {
  const { container } = render(
    <MemoryRouter>
      <MenuPerfil perfil={{ nome: 'Farmácia Bem Nascer', login: 'bemnascer', logoUrl }} />
    </MemoryRouter>,
  )
  return container
}

describe('MenuPerfil', () => {
  it('mostra o logo da empresa no avatar', () => {
    const img = renderizar('/empresas/1/logo').querySelector('img')

    expect(img).toHaveAttribute('src', expect.stringMatching(/\/empresas\/1\/logo$/))
  })

  it('sem logo, mostra as iniciais', () => {
    const container = renderizar()

    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('FN')
  })
})
