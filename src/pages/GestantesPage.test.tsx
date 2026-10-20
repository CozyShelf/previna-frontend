import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GestantesPage } from '@/pages/GestantesPage'

function responder(corpo: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(corpo)))
  render(
    <MemoryRouter>
      <GestantesPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GestantesPage', () => {
  it('lista as gestantes do médico', async () => {
    responder([
      {
        id: 1,
        nome: 'Maria Silva',
        cpf: '52998224725',
        telefone: '11987654321',
        dum: '2026-08-01',
        dataProvavelParto: '2027-05-08',
        primeiroAcessoPendente: true,
      },
    ])

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('CPF 529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(screen.getByText('08/05/2027')).toBeInTheDocument()
    expect(screen.getByText('Aguardando primeiro acesso')).toBeInTheDocument()
  })

  it('explica o pré-cadastro quando ainda não há gestantes', async () => {
    responder([])

    expect(await screen.findByText('Como funciona o pré-cadastro')).toBeInTheDocument()
  })
})
