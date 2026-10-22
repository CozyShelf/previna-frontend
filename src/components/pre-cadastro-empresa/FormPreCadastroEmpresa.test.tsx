import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormPreCadastroEmpresa } from './FormPreCadastroEmpresa'

function renderizar(onCadastrado = vi.fn()) {
  render(
    <MemoryRouter>
      <FormPreCadastroEmpresa onCadastrado={onCadastrado} />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FormPreCadastroEmpresa', () => {
  it('mostra o erro de cada campo ao enviar vazio, sem chamar a API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }))

    expect(screen.getByText('Informe a razão social.')).toBeInTheDocument()
    expect(screen.getByText('Informe o CNPJ.')).toBeInTheDocument()
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('Razão social')).toHaveFocus()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envia CNPJ e telefone só com dígitos', async () => {
    const empresa = { razaoSocial: 'Farmácia Bem Nascer', email: 'contato@bemnascer.com' }
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(empresa), { status: 201 }))
    const onCadastrado = vi.fn()
    renderizar(onCadastrado)

    await userEvent.type(screen.getByLabelText('Razão social'), empresa.razaoSocial)
    await userEvent.type(screen.getByLabelText('CNPJ'), '11222333000181')
    await userEvent.type(screen.getByLabelText('Responsável'), 'Ana Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), empresa.email)
    await userEvent.type(screen.getByLabelText('Telefone'), '1133334444')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }))

    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      razaoSocial: 'Farmácia Bem Nascer',
      cnpj: '11222333000181',
      responsavel: 'Ana Souza',
      email: 'contato@bemnascer.com',
      telefone: '1133334444',
    })
    expect(onCadastrado).toHaveBeenCalledWith(empresa)
  })
})
