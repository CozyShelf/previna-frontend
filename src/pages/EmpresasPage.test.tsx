import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EmpresasPage } from '@/pages/EmpresasPage'

function responder(itens: unknown[]) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ itens, pagina: 0, tamanho: 20, total: itens.length, totalPaginas: 1 }),
      ),
  )
  render(
    <MemoryRouter>
      <EmpresasPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EmpresasPage', () => {
  it('lista as empresas parceiras', async () => {
    responder([
      {
        id: 1,
        razaoSocial: 'Farmácia Bem Nascer',
        cnpj: '11222333000181',
        email: 'contato@bemnascer.com',
        telefone: '1133334444',
        responsavel: 'Ana Souza',
        logoUrl: '/empresas/1/logo',
        primeiroAcessoPendente: false,
      },
      {
        id: 2,
        razaoSocial: 'Loja Mamãe',
        cnpj: '12345678000195',
        email: 'loja@mamae.com',
        telefone: '11987654321',
        responsavel: 'Bia Lima',
        primeiroAcessoPendente: true,
      },
    ])

    expect(await screen.findByText('Farmácia Bem Nascer')).toBeInTheDocument()
    // Com logo, a imagem; sem logo, as iniciais
    const linhas = screen.getAllByRole('row')
    expect(linhas[1]?.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/empresas\/1\/logo$/),
    )
    expect(linhas[2]?.querySelector('img')).toBeNull()
    expect(screen.getByText('LM')).toBeInTheDocument()
    expect(screen.getByText('CNPJ 11.222.333/0001-81')).toBeInTheDocument()
    expect(screen.getByText('(11) 3333-4444')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Ativa')).toBeInTheDocument()
  })

  it('explica o pré-cadastro quando ainda não há empresas', async () => {
    responder([])

    expect(await screen.findByText('Como funciona o pré-cadastro')).toBeInTheDocument()
  })
})
