import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { entrarComo } from '@/test/sessao'
import { PrimeiroAcessoEmpresaPage } from './PrimeiroAcessoEmpresaPage'

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/primeiro-acesso']}>
      <Routes>
        <Route path="/primeiro-acesso" element={<PrimeiroAcessoEmpresaPage />} />
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route path="/" element={<p>Painel</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('PrimeiroAcessoEmpresaPage', () => {
  it('sem sessão leva ao login', () => {
    renderizar()

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('quem já concluiu o primeiro acesso vai direto ao sistema', () => {
    entrarComo('EMPRESA_PARCEIRA')
    renderizar()

    expect(screen.getByText('Painel')).toBeInTheDocument()
  })

  it('com a senha temporária mostra o formulário de finalizar o cadastro', () => {
    entrarComo('EMPRESA_PARCEIRA', true)
    renderizar()

    expect(
      screen.getByRole('heading', { name: 'Finalize o cadastro da sua empresa' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Novo login')).toBeInTheDocument()
  })
})
