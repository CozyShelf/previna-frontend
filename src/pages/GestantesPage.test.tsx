import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ContextoPerfil, Perfil } from '@/hooks/usePerfil'
import { GestantesPage } from '@/pages/GestantesPage'

const MARIA = {
  id: 1,
  nome: 'Maria Silva',
  cpf: '52998224725',
  telefone: '11987654321',
  dum: '2026-08-01',
  dataProvavelParto: '2027-05-08',
  primeiroAcessoPendente: true,
  medico: 'Ana Souza',
}

function responder(itens: unknown[], perfil?: Partial<Perfil>) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ itens, pagina: 0, tamanho: 20, total: itens.length, totalPaginas: 1 }),
      ),
  )
  const contexto = { perfil: perfil as Perfil, recarregarPerfil: () => {} } satisfies ContextoPerfil
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<Outlet context={contexto} />}>
          <Route path="/" element={<GestantesPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GestantesPage', () => {
  it('lista as gestantes do médico', async () => {
    responder([MARIA])

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('CPF 529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(screen.getByText('08/05/2027')).toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).getByText('Aguardando primeiro acesso'),
    ).toBeInTheDocument()
    // Sem a permissão, nem a coluna do médico nem o filtro de acompanhamento
    expect(screen.queryByRole('columnheader', { name: 'Médico' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Acompanhamento' })).not.toBeInTheDocument()
  })

  it('com a permissão de ver todas, mostra o médico de cada gestante e o filtro', async () => {
    responder([MARIA], { verTodasGestantes: true })

    expect(await screen.findByRole('columnheader', { name: 'Médico' })).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Acompanhamento' })).toBeInTheDocument()
  })

  it('explica o pré-cadastro quando ainda não há gestantes', async () => {
    responder([])

    expect(await screen.findByText('Como funciona o pré-cadastro')).toBeInTheDocument()
  })
})
