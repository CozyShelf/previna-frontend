import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PreCadastroEmpresaPage } from './PreCadastroEmpresaPage'

const EMPRESA = { razaoSocial: 'Farmácia Bem Nascer', email: 'contato@bemnascer.com' }

async function cadastrar() {
  await userEvent.type(screen.getByLabelText('Razão social'), EMPRESA.razaoSocial)
  await userEvent.type(screen.getByLabelText('CNPJ'), '11222333000181')
  await userEvent.type(screen.getByLabelText('Responsável'), 'Ana Souza')
  await userEvent.type(screen.getByLabelText('E-mail'), EMPRESA.email)
  await userEvent.type(screen.getByLabelText('Telefone'), '1133334444')
  await userEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PreCadastroEmpresaPage', () => {
  it('confirma o envio do pré-login e permite cadastrar outra empresa', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(EMPRESA), { status: 201 }),
    )
    render(
      <MemoryRouter>
        <PreCadastroEmpresaPage />
      </MemoryRouter>,
    )

    await cadastrar()

    expect(
      await screen.findByRole('heading', { name: 'Empresa pré-cadastrada e pré-login enviado' }),
    ).toBeInTheDocument()
    expect(screen.getByText(EMPRESA.razaoSocial)).toBeInTheDocument()
    expect(screen.getByText(EMPRESA.email)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para empresas' })).toHaveAttribute(
      'href',
      '/empresas',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar outra empresa' }))

    expect(screen.getByLabelText('Razão social')).toHaveValue('')
  })
})
