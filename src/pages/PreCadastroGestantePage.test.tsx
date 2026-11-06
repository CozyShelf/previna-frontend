import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PreCadastroGestantePage } from './PreCadastroGestantePage'

function renderizar() {
  render(
    <MemoryRouter>
      <PreCadastroGestantePage />
    </MemoryRouter>,
  )
}

async function cadastrar() {
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Maria da Silva')
  await userEvent.type(screen.getByLabelText('CPF'), '52998224725')
  await userEvent.type(screen.getByLabelText('Data de nascimento'), '1998-04-10')
  await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')
  await userEvent.type(screen.getByLabelText('Data da última menstruação (DUM)'), '2020-01-01')
  await userEvent.click(screen.getByRole('button', { name: /cadastrar gestante/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PreCadastroGestantePage', () => {
  it('depois do cadastro mostra o login e a senha temporária para entregar à gestante', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ login: '52998224725', senha: 'Tmp#1234' }), { status: 201 }),
    )
    renderizar()

    await cadastrar()

    expect(await screen.findByRole('heading', { name: 'Gestante cadastrada' })).toBeInTheDocument()
    expect(screen.getByText('Login').nextSibling).toHaveTextContent('52998224725')
    expect(screen.getByText('Senha temporária').nextSibling).toHaveTextContent('Tmp#1234')
    expect(
      screen.getByText(/até o primeiro acesso dela, você pode consultá-los de novo/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para gestantes' })).toHaveAttribute(
      'href',
      '/gestantes',
    )
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument()
  })

  it('"Cadastrar outra gestante" volta ao formulário em branco', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ login: '52998224725', senha: 'Tmp#1234' }), { status: 201 }),
    )
    renderizar()
    await cadastrar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar outra gestante' }))

    expect(screen.getByLabelText('Nome completo')).toHaveValue('')
    expect(screen.queryByText('Tmp#1234')).not.toBeInTheDocument()
  })
})
