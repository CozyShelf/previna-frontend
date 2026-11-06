import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MedicoPage } from './MedicoPage'

const MEDICO = {
  id: 3,
  nome: 'Ana Lima',
  cpf: '52998224725',
  email: 'ana@clinica.com',
  crm: 'CRM/SP 123456',
  login: 'ana',
  verTodasGestantes: true,
}

function renderizar(caminho: string) {
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/medicos/novo" element={<MedicoPage />} />
        <Route path="/medicos/:id" element={<MedicoPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MedicoPage', () => {
  it('no cadastro mostra o formulário vazio sem chamar a API', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    renderizar('/medicos/novo')

    expect(screen.getByRole('heading', { name: 'Cadastrar médico' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('na edição carrega o médico pelo id e preenche o formulário', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(MEDICO)))
    renderizar('/medicos/3')

    expect(screen.getByRole('heading', { name: 'Editar médico' })).toBeInTheDocument()
    expect(screen.getByText('Carregando médico…')).toBeInTheDocument()
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Ana Lima')
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/medicos\/3$/)
    expect(screen.queryByText('Carregando médico…')).not.toBeInTheDocument()
  })

  it('avisa quando não consegue carregar o médico', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }))
    renderizar('/medicos/99')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o médico.',
    )
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument()
  })
})
