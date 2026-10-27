import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ListaAgendamentos } from './ListaAgendamentos'
import type { Agendamento } from './statusAgendamento'

const AGENDAMENTOS: Agendamento[] = [
  {
    id: 1,
    tipo: 'Hemograma completo',
    categoria: 'EXAME',
    pontosBase: 25,
    dataPrevista: '2026-11-10',
    status: 'AGENDADO',
  },
  {
    id: 2,
    tipo: 'Consulta puerperal',
    categoria: 'CONSULTA',
    pontosBase: 50,
    dataPrevista: '2026-10-01',
    status: 'REALIZADO',
    dataConfirmacao: '2026-10-01T10:00:00',
  },
  {
    id: 3,
    tipo: 'Urina tipo I (EAS)',
    categoria: 'EXAME',
    pontosBase: 20,
    dataPrevista: '2026-09-20',
    status: 'NAO_COMPARECEU',
  },
]

describe('ListaAgendamentos', () => {
  it('agrupa por status com os pendentes primeiro', () => {
    render(<ListaAgendamentos agendamentos={AGENDAMENTOS} />)

    const grupos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(grupos).toEqual(['Pendentes', 'Realizados', 'Não compareceram'])
    expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
    expect(screen.getByText('10/11/2026')).toBeInTheDocument()
  })

  it('não mostra um grupo vazio', () => {
    render(<ListaAgendamentos agendamentos={AGENDAMENTOS.filter((a) => a.status !== 'NAO_COMPARECEU')} />)

    expect(screen.queryByText(/não compareceram/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Pendentes' })).toBeInTheDocument()
  })
})
