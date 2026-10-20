import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { MedicoLoginPage } from '@/pages/MedicoLoginPage'

function renderizar() {
  render(
    <MemoryRouter>
      <MedicoLoginPage />
    </MemoryRouter>,
  )
}

describe('MedicoLoginPage', () => {
  it('exibe o título da tela de login', () => {
    renderizar()

    expect(screen.getByRole('heading', { name: /entrar no previna/i })).toBeInTheDocument()
  })

  it('exibe os campos de login e senha', () => {
    renderizar()

    expect(screen.getByLabelText(/^login$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute('type', 'password')
  })

  it('exibe o link de recuperação de senha', () => {
    renderizar()

    expect(screen.getByRole('link', { name: /esqueceu a senha/i })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    )
  })
})
