import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { RotaProtegida } from '@/components/RotaProtegida'
import { salvarToken } from '@/lib/auth'

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
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('RotaProtegida', () => {
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
