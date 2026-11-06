import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MedicosPage } from './MedicosPage'

const MEDICOS = [
  {
    id: 3,
    nome: 'Ana Lima',
    cpf: '52998224725',
    email: 'ana@clinica.com',
    crm: 'CRM/SP 123456',
    login: 'ana',
    verTodasGestantes: true,
  },
  {
    id: 4,
    nome: 'Bruno Reis',
    cpf: '11144477735',
    email: 'bruno@clinica.com',
    crm: 'CRM/RJ 654321',
    login: 'bruno',
    verTodasGestantes: false,
  },
]

function responder(itens: unknown[]) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ itens, pagina: 0, tamanho: 20, total: itens.length, totalPaginas: 1 }),
        ),
    )
}

function renderizar(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/medicos', state }]}>
      <MedicosPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MedicosPage', () => {
  it('lista os médicos com CPF mascarado, CRM e o acesso às gestantes', async () => {
    const fetch = responder(MEDICOS)
    renderizar()

    expect(await screen.findByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('CPF 529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('CRM/RJ 654321')).toBeInTheDocument()
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Só as que acompanha' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar Bruno Reis' })).toHaveAttribute(
      'href',
      '/medicos/4',
    )
    expect(screen.getByRole('link', { name: /cadastrar médico/i })).toHaveAttribute(
      'href',
      '/medicos/novo',
    )
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/medicos$/)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra a confirmação deixada pelo formulário', async () => {
    responder(MEDICOS)
    renderizar({ mensagem: 'Ana Lima cadastrado.' })

    expect(screen.getByRole('status')).toHaveTextContent('Ana Lima cadastrado.')
    await screen.findByText('Ana Lima')
  })

  it('sem médicos, convida a cadastrar', async () => {
    responder([])
    renderizar()

    expect(await screen.findByText('Nenhum médico cadastrado ainda.')).toBeInTheDocument()
  })
})
