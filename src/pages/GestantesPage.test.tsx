import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
          <Route path="/gestantes/:id" element={<p>Página da gestante</p>} />
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

  describe('linha da gestante', () => {
    it('leva à gestante quando se clica em qualquer célula, não só no nome', async () => {
      responder([MARIA])

      await userEvent.click(await screen.findByText('(11) 98765-4321'))

      expect(screen.getByText('Página da gestante')).toBeInTheDocument()
    })

    it('o nome continua sendo o link para a gestante, para teclado e nova aba', async () => {
      responder([MARIA])

      const nome = await screen.findByRole('link', { name: 'Maria Silva' })
      expect(nome).toHaveAttribute('href', '/gestantes/1')
      await userEvent.click(nome)

      expect(screen.getByText('Página da gestante')).toBeInTheDocument()
    })

    it('a linha não vira mais um alvo de tab: o único da linha é o nome', async () => {
      responder([MARIA])

      const linha = (await screen.findByText('(11) 98765-4321')).closest('tr')!
      expect(linha).not.toHaveAttribute('tabindex')
      expect(within(linha).getAllByRole('link')).toHaveLength(1)
    })

    it('Ctrl+clique numa célula não navega pela linha', async () => {
      responder([MARIA])
      const usuario = userEvent.setup()
      const telefone = await screen.findByText('(11) 98765-4321')

      await usuario.keyboard('{Control>}')
      await usuario.click(telefone)

      expect(screen.queryByText('Página da gestante')).not.toBeInTheDocument()
    })
  })
})
