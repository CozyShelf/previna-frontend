import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { FormPreCadastroGestante } from './FormPreCadastroGestante'

function renderizar() {
  render(
    <MemoryRouter>
      <FormPreCadastroGestante onCadastrado={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('FormPreCadastroGestante', () => {
  it('avisa que o CPF é inválido assim que os 11 dígitos são digitados', async () => {
    renderizar()
    const cpf = screen.getByLabelText('CPF')

    await userEvent.type(cpf, '53341037839')

    expect(cpf).toHaveValue('533.410.378-39')
    expect(cpf).toHaveAccessibleDescription('CPF inválido. Confira os números digitados.')

    await userEvent.clear(cpf)
    await userEvent.type(cpf, '52998224725')

    expect(cpf).not.toHaveAttribute('aria-invalid')
  })

  it('mostra o erro de cada campo ao enviar vazio, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /cadastrar gestante/i }))

    expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument()
    expect(screen.getByText('Informe o CPF.')).toBeInTheDocument()
    expect(screen.getByText('Informe o telefone.')).toBeInTheDocument()
    expect(screen.queryByText(/e-mail válido/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })
})
