import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HomePage } from '@/pages/AtendenteLogin'

describe('HomePage', () => {
  it('exibe o título da tela de login da atendente', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { name: /previna - login atendente/i }),
    ).toBeInTheDocument()
  })

  it('exibe os campos de nome e senha da atendente', () => {
    render(<HomePage />)

    expect(screen.getByLabelText(/nome completo da atendente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha da atendente/i)).toBeInTheDocument()
  })

  it('exibe os links de recuperação de senha e de cadastro da mãe', () => {
    render(<HomePage />)

    expect(screen.getByRole('link', { name: /esqueceu a senha/i })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    )
    expect(screen.getByRole('link', { name: /registrar aqui/i })).toHaveAttribute(
      'href',
      '/register/mother',
    )
  })
})
