import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GestantePage } from './GestantePage'

const GESTANTE = {
  id: 7,
  nome: 'Maria Teste',
  cpf: '52998224725',
  telefone: '11999998888',
  email: 'maria@exemplo.com',
  dataNascimento: '1995-04-10',
  dum: '2026-06-01',
  dataProvavelParto: '2027-03-08',
  saldoPontos: 25,
  primeiroAcessoPendente: false,
  medico: 'Médico Teste',
}

const AGENDAMENTOS = [
  {
    id: 1,
    tipo: 'Hemograma completo',
    categoria: 'EXAME',
    pontosBase: 25,
    dataPrevista: '2026-11-10',
    status: 'AGENDADO',
  },
]

// A página faz duas chamadas: os dados da gestante e a lista de agendamentos
function responder(agendamentos: unknown[], status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (status !== 200) return new Response('{}', { status })
    return String(url).endsWith('/agendamentos')
      ? new Response(JSON.stringify(agendamentos))
      : new Response(JSON.stringify(GESTANTE))
  })
}

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/gestantes/7']}>
      <Routes>
        <Route path="/gestantes/:id" element={<GestantePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GestantePage', () => {
  it('mostra os dados da gestante e os seus agendamentos', async () => {
    responder(AGENDAMENTOS)
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Maria Teste', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(await screen.findByText('Hemograma completo')).toBeInTheDocument()
  })

  it('mostra o estado vazio e o link de cadastro quando não há nenhum agendamento', async () => {
    responder([])
    renderizar()

    expect(await screen.findByText(/nenhum exame ou consulta cadastrado/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /cadastrar exame ou consulta/i })[0]).toHaveAttribute(
      'href',
      '/gestantes/7/agendamentos/novo',
    )
  })

  it('avisa sem quebrar quando a API falha', async () => {
    responder([], 404)
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a gestante. Recarregue a página para tentar de novo.',
    )
  })
})
