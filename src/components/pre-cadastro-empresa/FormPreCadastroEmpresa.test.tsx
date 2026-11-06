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

  it.each([
    ['1122233300018', 'O CNPJ deve ter 14 dígitos.'],
    ['11222333000182', 'CNPJ inválido. Confira os números digitados.'],
  ])('recusa o CNPJ %s', async (cnpj, mensagem) => {
    renderizar()

    await userEvent.type(screen.getByLabelText('CNPJ'), cnpj)
    await userEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }))

    expect(screen.getByText(mensagem)).toBeInTheDocument()
  })

  it.each([
    [409, 'Já existe um cadastro com este CNPJ ou e-mail.'],
    [400, 'O servidor não aceitou os dados. Confira os campos e tente novamente.'],
    [500, 'Não foi possível cadastrar a empresa nem enviar o e-mail de acesso. Tente novamente.'],
  ])('com resposta %i da API, avisa e mantém o formulário', async (status, mensagem) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status }))
    const onCadastrado = vi.fn()
    renderizar(onCadastrado)

    await userEvent.type(screen.getByLabelText('Razão social'), 'Farmácia Bem Nascer')
    await userEvent.type(screen.getByLabelText('CNPJ'), '11222333000181')
    await userEvent.type(screen.getByLabelText('Responsável'), 'Ana Souza')
    await userEvent.type(screen.getByLabelText('E-mail'), 'contato@bemnascer.com')
    await userEvent.type(screen.getByLabelText('Telefone'), '1133334444')
    await userEvent.click(screen.getByRole('button', { name: /cadastrar empresa/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(onCadastrado).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /cadastrar empresa/i })).toBeEnabled()
  })
})
